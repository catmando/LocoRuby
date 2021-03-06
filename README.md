#LocoRuby (easily run local ruby code in a windows browser)#

LocoRuby is a simple way to evaluate local ruby code and include `<script type="text/ruby">...</script>` blocks on a web
page.

###How easy?###

```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>Bytes Free</title>
    <script type='text/javascript' src='javascripts/loco_ruby.js'></script>
</head>
<body>
    <input type="button" value="Bytes Free?"
           onclick="LocoRuby.eval('/([0-9]*) bytes free/.match(`dir /-C`)[1]', function(r){ alert(r + ' bytes free.')})"/>
</body>
</html>
```

##Why?##

Lets say your ruby project (rails, sinatra whatever) mainly runs as a browser application, but also needs to run a little 
script on a windows box.  
For example to control a legacy application that has no API, or to do some file management in the local environment.

Yes you can write a ruby script to do this, and even package it up as an windows executable.  Of course you are 
going to have to learn details of getting your app to run in windows, and perhaps learn a whole new GUI frame work.
Then you have to deploy the executable, and redeploy it if modifications are made.  And you have to 
setup a whole second configuration management system.

Instead wouldn't it be nice if you could just run your script in the browser?  Now your code is written as a 
normal page, with some ruby snippets to handle the code that has to execute on the local machine.  Your code is
now part of your larger application, and is deployed via the browser.

##Why Not?##

* You are building a public application where its not practical to ask users to install the LocoRuby.exe
* You are using JRuby in which case there are easier ways to do this by creating JRuby applets.
* The local environment you want to run on is not windows.

##Features##

* Simple to setup:  Install LocoRuby (using windows one click installer), and include ruby_local.js in your web page.
* Runs in the browser, write normal HTML / Javascript to create the client GUI.
* Add `<script type="text/ruby">` blocks to your pages, and then execute `LocoRuby.eval(....)` from javascript
* Tested in Windows XP and 7 (testing on Vista would be appreciated!)
* Includes Ruby Debug and Logger for debugging and logging. 
* Includes auto-gui gem to easily drive windows applications.
* Includes FxRuby gem for creating local complex GUIs.
* Extra security checking option available. (let me know if you see any holes, or ways to improve)

##Sample Uses##

* Control of legacy windows applications that don't have APIs
* Manipulate files on the local machine
* Manufacturing floor device control

##How to use##

1. Run LocoRuby.exe to install on your windows box.  
2. In your application web page include loco_ruby.js (after JQuery if you are using JQuery)
3. Optionally call `LocoRuby.init({...})` to override default parameters.
4. In your application web page put `<script type="text/ruby">...</script>` blocks to hold your local ruby code.
5. Call `LocoRuby.eval(...ruby expression..., function(return_value) {...})` to evaluate ruby expressions.

##Dependencies

JQuery - However if loco_ruby does not detect the JQuery object it will automatically load it so it is not required
to be included.  If you do use JQuery just include it before you do the LocoRuby to avoid redundant loads.

##How it works##

The LocoRuby.exe is simply a webrick server that acts as bootstrap loader.  The browser makes cross browser requests to 
127.0.0.1:8000 to send the LocoRuby.exe the ruby code, which is loaded as anonymous modules.

To keep the LocoRuby.exe as simple as possible it provides nothing but the basic capabilities.  Additional features 
are provided by the loco_ruby.js file which collects the application ruby scripts from the web page, and wraps it up so 
you can call eval in the context of the downloaded code.  The loco_ruby.js file also contains all the javascript and
ruby code needed to manage the popup window interactions.

##Simple Example##

This is a simple example that brings up a window showing the current number of bytes used on the disk, updated
every minute.

```html
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
    <title>Bytes Free</title>

    <script type='text/javascript' src='javascripts/loco_ruby.js'></script>

    <script type='text/javascript'>
        LocoRuby.init({
            dimensions: {top: 20, left: 20, width: 150, height: 120},
            stay_on_top: true,
            onload: function() {update_display(); setInterval(update_display, 60*1000)},
            popup_blocked: function() {}
        })

        function update_display() {
            LocoRuby.eval("bytes_free", function (r) {
                document.getElementById("bytes_free") = r/1024
            })
        }

    </script>

    <script type='text/ruby'>

        def bytes_free
            /([0-9]*) bytes free/.match(`dir /-C`)[1]
        end

    </script>
</head>
<body>
    <div class="LocoRuby_loading">
        Loading Application... If this message does not go away, then check to see that
        you are running the LocoRuby.exe and that your browser is not blocking popups.
    </div>
    <div class="LocoRuby_loaded">
        <span id="bytes_free"></span>K bytes free
    </div>
</body>
</html>
```
##LocoRuby.init Parameters##

Call LocoRuby.init to override any of the defaults. LocoRuby.init takes a hash with the following optional keys:

* title: a string that overrides the page title
* dimensions:  a hash containing left, top, width, and height popup window position and size.  
* stay_on_top:  if true then the popup window will be forced to stay on top of all other windows
* popup_timeout: how long to wait before guessing that there is a popup blocker running.  Default is 10 seconds.
* popup_blocked: function to be called if popup_timeout expires.  Default overwrites the document body with a message.
* onload: a function that will be called once the ruby script has been loaded and is ready to go
* eval_timeout: how long to wait before we assume that the evaluation has died. Defaults to 10 seconds.
* connection_failure: a function to be called if the LocoRuby service cannot be contacted.  Defaults to an alert box.
* verification_failure: a function to be called if the security checks fail. Defaults to an alert box.
* host: a string with host:port that LocoRuby.exe is listening to. Defaults to 127.0.0.1:8000 if not provided.  
* encrypt: a function that digests as salted string using SHA1.hexdigest, used for extra security checking

###Examples###

```javascript
LocoRuby.init({}) 
      // run the code in the current window, no security checking.  Same as LocoRuby.init(), or not calling it at all.  
      
LocoRuby.init({title: "My PC App"})
      // override the page title with "My PC App".

LocoRuby.init({onload: function(){alert('everything working!')}}) 
      // pop up an alert once everything is downloaded.
      
LocoRuby.init({popup_timeout: 5000, popup_blocked: function () {alert('turn off popup blockers')}})
     // after 5 seconds if we can't get a popup going, bring up an alert.
      
LocoRuby.init({dimensions: {top: 50, left: 50, width: 400, height: 400}})
      // run in a new 400 X 400 popup positioned at 50, 50.  top, left, width, and height must all be supplied.
      
LocoRuby.init({stay_on_top: true, dimensions: {top: 50, left: 50, width: 400, height: 400}})
      // run in a new popup that stays above all other windows.  stay_on_top is ignored unless dimensions are provided.
      
LocoRuby.init({connection_failure: function() {document.title = "CONNECTION FAILURE"}})
      // change document title instead of bringing up alert.  verfication_failure works the same
      
LocoRuby.init({host: "127.0.0.1:8001"})
     // use port 8001 instead of 8000.  Note you must run LocoRuby with the matching port. I.e.
     // LocoRuby --port 8001
     
LocoRuby.init({encrypt: function(s, fn) {
                jQuery.ajax({
                    url: "/loco_ruby_encrypt_helper/"+s,
                    context: document.body,
                    error: function(jqXHR, textStatus, errorThrown) {
                        alert("failed to get encrypted response from server")
                        },
                    success: fn
                    })}})
      // use a server side REST method to digest strings.   More below on this...

```
##Running the Windows Installer##

Download LocoRuby.exe and run it.  You can simply click through the options pages and you will have a vanilla install
that starts LocoRuby when the PC starts up, and listens on port 8000, with no security code.  

You may also setup the following options:

* name of the LocoRuby application shortcuts and program directory
* port that LocoRuby will listen to (-p option)
* the security salt key (-k option)
* a web page that will be brought up when LocoRuby starts (-o option)

The options are sent through as command line options in the shortcuts set up via the installer.  See below for details 
on the options.

##Evaluating Local Ruby Code##

To evaluate an expression in the local ruby environment call 
`LocoRuby.eval("some ruby expression",optional_call_back, optional_time_out)`.  

The first parameter is a string that will be evaluated in the context of a module made up of any code you have included
in `<script type="text/ruby">` blocks.

The `optional_call_back` is a javascript function that receives the result of your evaluation as string.  If the
evaluation times out undefined will be passed to the function.

The `optional_time_out` (in milliseconds) defaults to 10,000 (10 seconds) if not provided.  Can also be overriden
globally in LocoRuby.init().

##Popup Window Management##

One of the features of LocoRuby is that you can create simple windows dialogs that run in the browser, but act like 
stand alone windows applications.

The trigger for this capability is providing dimensions to the init function.  This lets LocoRuby know that a new
dialog window is desired.

To accomplish this LocoRuby reloads the current page into a newly created browser popup, 
which is then sized and optionally forced to stay on top.

Once this is done, we want to get rid of the original browser window, so we either do a back `(history(-1))` or if there
is no history then just close the original browser window (more on why below.)

Because LocoRuby is not currently set up to deal nicely with multiple windows running the same "application" it also 
makes sure that any existing popups (of the same application name) are closed before calling onload.

While all this seems complicated it gives a nice user experience.  You can create an application links page
that links to your LocoRuby popup pages.  When the link is followed the LocoRuby page will be loaded in the same browser 
window, but then a popup will come up, and the parent window will go back to the original page, thus the popup acts
like target="_BLANK", where you can control the size of the new window.

You can also create a windows short-cut where the target is the LocoRuby page.  In this case when a user opens the 
short-cut a new browser window with no history is created, in which the LocoRuby code will begin to run.  Once the 
popup is created the original window (with no history) can be deleted. 

During debug you may find dealing with a javascript debugger is incompatible with the popup.  Just change the
dimension key to something like dimension_off, and it will be ignored, and you won't get a popup.

##The LocoRuby_loading and _loaded classes##

HTML with the LocoRuby_loaded class will remain hidden until the ruby code is up and running.  The LocoRuby_loading 
class will then be hidden.  Use these classes to display appropriate content before and after loading has completed.

##Host and Ports##

By default LocoRuby.exe listens on port 8000, and the LocoRuby javascript object communicates with 127.0.0.1.  To
listen on a different port run LocoRuby with the --port (-p) option. I.e. `LocoRuby -p8001`.  The LocoRuby js object
must be initialized for the same host:port using the host: key.  

I.e. ...`host: "127.0.0.1:8001"`....

##Security##

If you want to add additional security you can set up a key on both your server and the local machine.  You must 
provide a digest function on your server that matches the digest in LocalRuby.

1. On the local machine launch LocoRuby with the `--key your_key` option.  I.e. `LocoRuby --key myspecialkey`.  If 
you are launching LocoRuby from a shortcut (.lnk) your can specify the options in the shortcut target, but here is a tip:
Typically your shortcut link will look like this `"C:/SomeDirectory/LocoRuby.exe"`.  You want to specify the options
outside the double quotes, i.e `"C:/SomeDirectory/LocoRuby.exe" --key myspecialkey`
2. On the server provide a service to digest a string
like this `Digest::SHA1.hexdigest("--#{your_key}--#{some_string}--")` 
I.e. `Digest::SHA1.hexdigest("--myspecialkey--#{s}--")` where s is the string to digest typically provided via a get
request parameter.
3. Provide an encrypt function to LocalRuby.init.  The function takes a string and a call back.  Make an ajax call to your 
server routine to encrypt the string and return the digested string.  See the example above for a typical encrypt
function.

##Open Browser Window on Startup##

In many cases you will be using LocoRuby to simply provide the local "drivers" for a specific webpage.  In this case
you can provide the url of the webpage via the -o (--open) option.  I.e. `LocoRuby -o"www.mysite.com/some_local_app_page"`.

When LocoRuby starts the webpage you specify will be opened, so you now effectively have a PC app, whose code resides 
on your server.

##System Tray Icon##

When LocoRuby.exe is running it displays a ruby symbol in the windows system tray.  You can update the 
tip text displayed by the icon by writting to the LocoRuby::Console.tray_icon_tip_text.  I.e. 
`LocoRuby::Console.tray_icon_tip_text = "I just wrote this"`

##FxRuby##

Should you need a more complex UI, the FxRuby gem is included.  Just `require fox16` in your local ruby script.

##Debug and Logging##

The LocoRuby executable is bundled with ruby debug, so all you have to do is invoke the debugger method.  When the 
debugger starts a terminal window will be opened on the windows box.   You use all the normal debugger features once
you are in the console. 

You can start the debugger from a javascript console (i.e. firebug) by calling `LocoRuby.debug()`.

Inside your local ruby code you write to the logger via the LocoRuby::Log object.  I.e. `LocoRuby::Log.info "hello!"`. 
By default the log level is set to info.

Log files are written to the directory containing the LocoRuby executable.  Typically you will want to start a 
console and run `tail -f debug.log` to view the log file contents.

You can also start LocoRuby.exe with the -d (--debugger) option which will set the logging level to DEBUG, write the
logs to STDOUT (the console) and leave the console window open.

When debugging it is usually good to turn off the popup window feature so you can easily get at your browser 
debugger.  The simple way to do this is just change the dimensions key to dimensions_off which will be ignored, and
your application will run in the current browser window.

##Rolling Your Own##

If you want to build your own LocoRuby.exe, you will need to install Ruby on a windows box, and install all the gems.
LocoRuby comes in a 
single .rb file.  You will also need to install Innosetup to create the one click installer.  

Once you are happy you can build a new installer exe by running Rake.   

##Things to Do##

Make it work with multiple instances of the same application.  To do this is just a matter of skipping the download if the 
page has
not changed.

Create a javascript object that contains constants, methods, and instance variables of the local ruby code.  Then we
can just say `LocoRuby.my_local_method()` instead of using eval.   Likewise return the result as a jsonp object instead 
of a string.

Instead of using the browser popup, create a webkit based browser window in native UI app.  This would give us better
control over the way the popup looks.

Make Mac and Unix versions of the LocoRuby exe, and package up the right set up gems that would be needed for local
machine access.

##MIT License##

Copyright (c) 2011 CatPrintLabs.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and 
associated documentation files (the "Software"), to deal in the Software without restriction, including 
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the 
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions 
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
IN THE SOFTWARE.

##Credits##

Lars Christensen for the Ocra Gem used to create the executable.

Robert Wahler for the auto-gui gem which is included and makes controlling window's gui apps easy.

Thanks for the FxRuby gem.

Thanks to InnoSetup!


