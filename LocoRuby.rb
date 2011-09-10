require 'rubygems'
require 'logger'
#require 'pry'
require 'win32/autogui'
require 'win32ole'
include Autogui::Input
require 'webrick'
require 'fox16'
require 'irb'
gem 'ruby-debug', '= 0.10.3'
require 'ruby-debug'

class Logger  
	def format_message(level, time, progname, msg)  
		"#{time.strftime("%Y-%m-%d %H:%M:%S")} -- #{msg}\n"  
	end    
end

module LocoRuby
class StoutClientLoader < WEBrick::HTTPServlet::AbstractServlet

	def initialize(server)
		@window = server[:Window]
		super
		@@ready ||= {}
		@@response_id ||= {}
	end
   
	def do_GET(request, response)
		response.status = 200
		response.content_type = "text/plain"
		if request.path == "/ready"
		    ready = @@ready[request.query["session_id"]]
		    @logger.info "Ready Request: "
			@logger.info "  response_id:       #{request.query["response_id"]}"
			@logger.info "  loco ruby expects: #{ready}"
			if !request.query["response_id"] or !request.query["session_id"]
				r = "no response_id provided"
			elsif !request.query["session_id"] 
				r = "no session_id provided"
			elsif !ready 
				r = "not ready"
			elsif ready != request.query["response_id"]
			    r = "response_id does not match encrypted session_id"
			else
			    r = "ready"
			end
			@logger.info "ready status request, returning '#{r}'"
			response.body = "#{request.query['callback']}('#{r}')"
		else
			@logger.info "Confirming LocoRuby identity.  Session id: #{request.query['session_id']}"
			@@response_id[request.query["session_id"]] = response_id = (0...50).map{ ('a'..'z').to_a[rand(26)] }.join
			@@ready[request.query["session_id"]] = nil
			response.body = "#{request.query['callback']}({session_id: '#{encrypt(request.query["session_id"])}', response_id: '#{response_id}'})"
			@window.tray_icon_tip_text = "confirming local identity..."
		end
	end
   
	def do_POST(request, response)
		response.status = 200
		response.content_type = "text/plain"
		@logger.info "Request for code load.  Confirming remote server identity"
		response_id = @@response_id[request.query["session_id"]]
		unless response_id && request.query["response_id"]==encrypt(response_id)
			response.status = 500
			response.body = "failed security check."
			@logger.error "failed security check - theirs/unencrytped/encrypted: #{request.query['response_id']}/#{response_id}/#{encrypt(response_id)}"
			@window.tray_icon_tip_text = "remote server failed security check!"
			return
		 end
		 code_file_name = request.query['file_name'] || "loco_ruby_client_script.rb"
		 @logger.info "loading code...(#{request.query['code'].length} bytes)"
		 @logger.debug request.query["code"]
		 code_file = File.new(code_file_name, "w")
		 code_file.write(request.query["code"])
		 code_file.close
		 @logger.info "evaluating..."
		 begin
		   @logger.info result = load(code_file_name, true) #Class.new.instance_eval { load(code_file_name) }
		   @logger.info "ready"
		   @window.tray_icon_tip_text = "code loaded (#{request.query['code'].length} bytes)"
		   @@ready[request.query["session_id"]] = encrypt(response_id)
		   response.body = result.to_s
		 rescue Exception => e
		   @logger.error "evaluation failed #{e.message} see http response for backtrace"
		   @window.tray_icon_tip_text = "code failed to load"
		   response.body = "#{e.message}\n#{e.backtrace}"
		   response.status = 500
		 end
	end
   
   protected
   
   def encrypt(text)
     Digest::SHA1.hexdigest("--CatPrint is the C00lest!--#{text}--")
   end

end

class ConsoleInternal 
 
	RT_ICON         =  3
	DIFFERENCE      = 11
	RT_GROUP_ICON   = RT_ICON + DIFFERENCE
	NIF_MESSAGE 	= 1
	NIF_ICON    	= 2
	NIF_TIP     	= 4
	NIM_ADD     	= 0
	NIM_MODIFY  	= 1
	NIM_DELETE  	= 2
	IMAGE_ICON 		= 1
	LR_LOADFROMFILE = 16
	UID 			= 'LocoRuby'.hash
	WM_SYSCOMMAND 	= 0x112
	SC_CLOSE 		= 0xF060
  
	NotifyIcon  = Win32API.new('shell32', 'Shell_NotifyIconA', 'LP', 'I')
	LoadImage = Win32API.new('user32', 'LoadImage', 'LPIIII', 'L')
	SystemTrayIcon = LoadImage.call(0, "#{File.dirname(__FILE__)}/LocoRuby.ico", IMAGE_ICON, 0, 0, LR_LOADFROMFILE)
	ShowWindow = Win32API.new('user32', 'ShowWindow', 'LI', 'I')
	SendMessage = Win32API.new('user32', 'SendMessage', 'LLLP', 'L') 
	SetWindowText = Win32API.new('user32', 'SetWindowText', 'LP', 'L')

	def initialize(title, log)
		@console_handle = Win32API.new('kernel32','GetConsoleWindow','','L').call
		@logger = log
		@logger.info "closing any already running servers"
		Autogui::EnumerateDesktopWindows.new().find do |w|
		  if w.title == title
			SendMessage.call(w.handle, WM_SYSCOMMAND, SC_CLOSE, 0)
			sleep 2 # not the best but... 
			@logger.info "found and closed running server"
			true
		  end
		end
		SetWindowText.call(@console_handle, title)
		tip_text = "initializing..."
		pnid = [6*4+64, @console_handle, UID, NIF_ICON | NIF_TIP, 0, SystemTrayIcon].pack('LLIIIL') <<
		   tip_text << "\0"*(64 - tip_text.size)
		if NotifyIcon.call(NIM_ADD, pnid)
			@logger.info "system tray icon tip text initialized" 
		else
			@logger.error "system tray icon tip text could not be initialized."
		end	
	end
 
	def shutdown
		pnid = [6*4+64, @console_handle, UID, 0, 0, 0].pack('LLIIIL') << "\0"
		@logger.info "deleting system tray icon. status = #{NotifyIcon.call(NIM_DELETE, pnid)}"
	end
	
	def tray_icon_tip_text=(tip_text)
		pnid = [6*4+64, @console_handle, UID, NIF_ICON | NIF_TIP, 0, SystemTrayIcon].pack('LLIIIL') <<
			tip_text << "\0"*(64 - tip_text.size)
		if NotifyIcon.call(NIM_MODIFY, pnid)
			@logger.info "system tray icon tip text updated: #{tip_text}" 
		else
			@logger.error "system tray icon tip text could not be updated."
        end
	end
	
	def hide
		ShowWindow.call(@console_handle, 0)
	end
	
	def show
	    @logger.info "Show Console"
		ShowWindow.call(@console_handle, 9)
		Win32API.new('user32', 'BringWindowToTop', 'L', 'I').call(@console_handle)
	end
  
end

end
if $0 == __FILE__  and !defined?(Ocra)
module LocoRuby
	if ARGV.length > 0 && ARGV[0]=="-d" 
		log = Logger.new(STDOUT)
		log.level = Logger::DEBUG
		log.info "LocoRuby Starting.  Debug level = DEBUG"
	else
		log = Logger.new("debug.log", "daily")
		log.level = Logger::INFO
		log.info "LocoRuby Starting. Debug level = INFO"
	end

	console = ConsoleInternal.new("LocoRuby Console", log)
	console.tray_icon_tip_text = "mounting server..."
	server = WEBrick::HTTPServer.new(:Port => 8000, :Logger => log, :Window => console)

	server.mount "/load_slave", StoutClientLoader
	server.mount "/ready", StoutClientLoader
	
	log.info "Server mounted.  Starting server now"
	console.tray_icon_tip_text = "server waiting..."

	  Console = console
	  Server = server
	  Log = log
	  if ARGV.length == 0 or ARGV[0]!="-d" 
		console.hide
	  else
	    Debugger.start
	    debugger
	  end
	end
    trap "SIGINT" do 
	  LocoRuby::Log.info "CTL-C Captured"
	  LocoRuby::Server.shutdown 
	  LocoRuby::Console.shutdown
	end
	begin
	LocoRuby::Server.start 
	rescue 
	LocoRuby::Log.info "webrick shut down. Exiting program"
	LocoRuby::Console.shutdown
	end
 end
 





