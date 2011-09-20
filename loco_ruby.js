var LocoRuby = LocoRuby ? LocoRuby : function() {

    (function() {
        var head = document.getElementsByTagName('head')[0],
            style = document.createElement('style'),
            rules = document.createTextNode('.RubyLoco_loaded { display: none }');

        style.type = 'text/css';

        if (style.styleSheet) {
            style.styleSheet.cssText = rules.nodeValue;
        } else {
            style.appendChild(rules);
        }
        head.appendChild(style);
        })();

    var initialized = false;

    var $j

    var session_id = (function() {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
        var length = 20;

        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
        })()

    var window_dimensions
    var title
    var module_name
    var encrypt = function (s, fn) {fn("")}
    var onload = function (){}
    var z_order = 'HWND_TOP'
    var host = "127.0.0.1:8000"
    var connection_failure = function() {
        alert ("Could not contact LocoRuby.  Make sure LocoRuby.exe is running.");
        self.close()
    }
    var verification_failure = function() {
        alert ("Failed security checks.  Make sure LocoRuby is using same key as your server.");
        self.close()
    }
    var popup_timeout = 10000
    var popup_blocked = function() {
        document.body.innerHTML = 'Turn off popup blocker and reload'
    }
    var eval_timeout = 10000

    var public = {

        init: function(params) {
            if (params==undefined) params = {}
            title = params.title
            if (params.encrypt!=undefined) encrypt = params.encrypt
            if (params.dimensions != undefined) window_dimensions = params.dimensions
            if (params.onload != undefined) onload = params.onload
            if (params.stay_on_top != undefined && params.stay_on_top) z_order = 'HWND_TOPMOST'
            if (params.host != undefined) host = params.host
            if (params.connection_failure != undefined) connection_failure = params.connection_failure
            if (params.verification_failure != undefined) verification_failure = params.verification_failure
            if (params.popup_timeout != undefined) popup_timeout = params.popup_timeout
            if (params.popup_blocked != undefined) popup_blocked = params.popup_blocked
            if (params.eval_timeout != undefined) eval_timeout = params.eval_timeout
            if (typeof jQuery == 'undefined') {
                load_jquery()
            } else {
                init_jquery_loaded(jQuery)
            }},

        /* LocoRuby.eval("string",fn) -> result of evaluation is passed to fn, if evaluation fails undefined is sent to fn */

        eval: function (s,fn, timeout) {
            if (timeout == undefined) timeout = eval_timeout;
            encrypt(s, function(e_s) {
                call_loco_ruby_server('loco_ruby_eval/'+module_name, {ruby_expression: s, encrypted_ruby_expression: e_s}, timeout, fn)})
            },

        debug: function() {this.eval("debugger")}

        }

    var load_jquery = function() {
        var callback = function () {
            init_jquery_loaded(jQuery.noConflict())
        }
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = "http://code.jquery.com/jquery-1.6.3.min.js" ;
        // there are several events for cross browser compatibility
        script.onreadystatechange = callback;
        script.onload = callback
        // fire the loading
        head.appendChild(script);
        }

    var init_jquery_loaded = function($) {
        if (initialized) return
        initialized = true
        $j = $
        if (title==undefined) title = window.document.title 
        module_name = title.replace(" ", "_").replace(/[^a-zA-Z0-9_]/,"").replace(/_+/g, '_').replace( /(_)([a-z])/g, function(t,a,b) { return b.toUpperCase(); })
        $j(window).load(function () {
            //setup session_id and module_name variables
            if (window_dimensions) {
                /* if this window has a specified size, then it must be opened as a popup, in order to specify the size.
                   There are two cases that we need to handle:

                   1) this browser window has been opened from the desktop in which case it has no history, and it
                      should be closed, once the popup is running.

                   2) this browser window has history, in which case we got here from a link from a previous page,
                      in this case we want the browser window to go back to previous page, so it looks like the popup
                      was opened as a target=_BLANK but with specified window parameters.

                   In addition the current implementation only supports one instance running of each application.
                   (note: This is actually not hard to change, we just need to check if there is a server instance running, and
                   make sure the backing file is the same as the one we are going to send down. )

                   So for now we close all windows on the desktop with the name of the application, this will close the
                   opener browser window, unless its changed first.

                   The final complication is dealing with popup blockers.  In particular chrome actually opens the popup
                   but makes its dimensions 0,0,0,0.  So what we do is wait a little bit and display a message.  If the popup
                   worked then we will either close the window or go back to the previous page, so the message will never
                   be seen.  To handle the chrome case we just exit out if innerHeight == 0.
                 */
                if (window.innerWidth == 0 && window.innerHeight == 0) {
                    return
                } else if (!opener || !openerAccessible()) {
                    if (history.length > 1) {
                        // change title so auto closer can't find us...
                        document.title = "APPLICATION LOADING..."+document.title
                    }
                    var newWindow = popUpWindow(document.URL);

                    setTimeout(function () {popup_blocked()}, popup_timeout)
                } else {
                    // if opener has history (meaning it was not opened from a desk top icon) go back to previous page
                    if (opener.history.length > 1) {
                       opener.history.go(-1)
                    }
                    // change document title so auto closer can't find us
                    document.title = session_id;
                    send_ruby_code();
                    window.focus();
                }
            } else { /* window size not specified so we just run in current window */
                document.title = "APPLICATION LOADING..." + document.title
                send_ruby_code();
                window.focus();
            }})}

    var call_loco_ruby_server = function(name, json, timeout, fn) {
        var timer
        if (fn != undefined) timer = setTimeout(function() {
            timer = undefined
            if (fn!=undefined) {
                fn();
            }}, timeout);
        jQuery.ajax({
            url: "http://"+host+"/"+name,
            data: json,
            dataType: 'jsonp',
            success: function (responseObject) {
                if (timer != undefined) {
                    clearTimeout(timer);
                    fn(responseObject);
                }}})}

    var gather_ruby_app_code = function() {

         var code = ([
            'class LocoRubyEvalServer < WEBrick::HTTPServlet::AbstractServlet',

                'def do_GET(request, response)',
                    'response.content_type = "text/plain"',
                    'begin',
                        'raise "Failed Validation" if LocoRuby::encrypt(request.query["ruby_expression"])!=request.query["encrypted_ruby_expression"]',
                        'result = eval(request.query["ruby_expression"])',
                        'response.body = "#{request.query[\'callback\']}(\'#{result}\')"',
                        'response.status = 200',
                    'rescue Exception => e',
 		                'LocoRuby::Log.error "AppCode evaluation failed #{e.message} see http response for backtrace"',
		                'response.body = "#{e.message}\\n#{e.backtrace}"',
		                'response.status = 500',
                    'end',
                'end'].concat((window_dimensions!=undefined)?[

                    // get rid of any old windows with same app, name, get rid of parent window, and bring me to the top

   	                'HWND_TOPMOST = -1',
                    'HWND_TOP = 0',
	                'SWP_NOSIZE = 1',
	                'SWP_NOMOVE = 2',
                    'WM_SYSCOMMAND = 0x112',
	                'SC_CLOSE = 0xF060',

                    'my_window_handles = []',
                    'Title = "'+title+'"',
                    'LocoRuby::Log.info "Looking for windows to close and bring to top..."',
                    'handles_to_close = []',
                    'Autogui::EnumerateDesktopWindows.new().find do |w|',
                        'if w.title[0, Title.length] == Title',
                            'LocoRuby::Log.info "Matched App Title.  Adding to close list"',
                            'handles_to_close.push(w.handle)',
                        'elsif w.title[0, "'+session_id+'".length] == "'+session_id+'"',
                            'my_window_handles.push(w)',
                        'end',
                        'nil',
                    'end',
                    'my_window_handles.each do |h|',
                        'LocoRuby::Log.info "Matched session id.  Setting Window Position"',
                        'Win32API.new("user32", "SetWindowPos", ["P", "P", "I", "I", "I", "I", "I"], "I").call(',
                            'h.handle, '+z_order+', 0, 0, '+window_dimensions.width+', '+window_dimensions.height+', SWP_NOMOVE)',
                        'h.set_focus',
                        'LocoRuby::Log.info "Window Position Set #{h.handle}"',
                    'end',
                    'handles_to_close.each do |h|',
                        'Win32API.new("user32", "SendMessage", "LLLP", "L").call(h, WM_SYSCOMMAND, SC_CLOSE, 0)',
                    'end',
                    'LocoRuby::Log.info "Done!"'] : []).concat([

            'end',
            //# add class to server
            'LocoRuby::Server.mount "/loco_ruby_eval/'+module_name+'",LocoRubyEvalServer'])).join("\n")

        $j('script[type="text/ruby"]').each(function(i, b){
            code = code + "\n" + b.innerHTML
            });
        return code
        }

    var send_ruby_code = function() {
        encrypt(session_id, function(encrypted_session_id) {
            call_loco_ruby_server("load_slave", {session_id: session_id}, 3000, function (responseObject) {
                  if (responseObject==undefined ) {
                    document.title = title
                    connection_failure()
                  } else if (responseObject.session_id != encrypted_session_id) {
                    document.title = title
                    verification_failure()
                  } else {
                    send_ruby_code2(session_id, responseObject.response_id)
                  }
                })})}

    var send_ruby_code2 = function(session_id, response_id) {
        encrypt(response_id, function(response) {
            var formDiv = '<div style="display:none">'+
                '<form id="frmLocoRubyCrossDomainPost" action="http://'+host+'/load_slave"'+
                    'method="post" target="iframeLocoRubyCrossDomainTarget"'+
                    'style="border: 0px solid rgb(255, 255, 255); width: 0pt; height: 0pt;">'+
                    '<input type="hidden" name="code" id="loco_ruby_cdp_code"/>'+
                    '<input type="hidden" name="response_id" id="loco_ruby_cdp_response_id"/>'+
                    '<input type="hidden" name="session_id" id="loco_ruby_cdp_session_id"/>'+
                    '<input type="hidden" name="file_name" id="loco_ruby_cdp_file_name_id"/>'+
                    '</form>'+
                    '<iframe id="iframeLocoRubyCrossDomainTarget" name="iframeLocoRubyCrossDomainTarget"'+
                             'src="#" style="border: 0px solid rgb(255, 255, 255);'+
                             'width: 0pt; height: 0pt;">'+
                    '</iframe>'+
                '</div>'

            $j(document.body).append(formDiv)

            $j('#loco_ruby_cdp_code')[0].value = gather_ruby_app_code();
            $j('#loco_ruby_cdp_response_id')[0].value = response;
            $j('#loco_ruby_cdp_session_id')[0].value = session_id;
            $j('#loco_ruby_cdp_file_name_id')[0].value = module_name+'.rb';
            $j('#frmLocoRubyCrossDomainPost')[0].submit();
            var looper = setInterval(function(){
                if (document.title != title) {
                    call_loco_ruby_server("ready", {session_id: session_id, response_id: response}, 1000, function (responseObject) {
                        if (responseObject=="ready") {
                            document.title = title;
                            $j('.RubyLoco_loading').hide()
                            $j('.RubyLoco_loaded').show()
                            onload()
                        }})
                } else {
                    clearInterval(looper)
                }}, 1000)}
            )}

    var popUpWin;

    var popUpWindow = function(URLStr) {
        if (popUpWin) {
            if(!popUpWin.closed) popUpWin.close();
            }
        popUpWin = open(URLStr, session_id, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=yes, width='+window_dimensions.width+', height='+window_dimensions.height+', left='+window_dimensions.left+', top='+window_dimensions.top+', screenX='+window_dimensions.left+', screenY='+window_dimensions.top+'');
        return popUpWin
        }

    var openerAccessible = function () {
        try {
            var foo = opener.history.length;
            return true
        } catch (e) {
            return false
        }}

    return public;

} ();

LocoRuby.init()
