#LocoRuby (easily run local ruby code in a windows browser)#

LocoRuby is a simple way to include `<script type="text/ruby">...</script>` blocks on a 
page and execute the code in the local windows environment.

##Why?##

Your ruby project mainly runs as a browser application, but needs to run a little script on a windows box.  
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

* Simple to setup:  Only requirement is that the local machine is running the LocoRuby.exe
* Works in any browser
* Add `<script type="text/ruby">` blocks to your pages, and then execute `local_ruby_eval(....)` from javascript
* Tested in Windows XP and 7 (testing on Vista would be appreciated!)
* Includes Ruby Debug and Logger for debugging and logging 
* Includes auto-gui gem to easily drive windows applications
* Includes FxRuby gem for creating local GUIs (or just use the browser)
* Extra security (let me know if you see any holes, or ways to improve)


##Sample Uses##

* Control of legacy windows applications that don't have APIs
* Manipulate files on the local machine
* Manufacturing floor device control

##How to use##

1. On the windows box you will need to be running LocoRuby.exe.  
2. In your application web page include loco_ruby.js
3. Call `LocoRuby.init({...})` to setup you application
4. In your application web page put `<script type="text/ruby">...</script>` blocks to hold your local ruby code
5. Call `LocoRuby.eval("ruby expression", function(return_value) {...})` to evaluate ruby expressions

##Dependencies

JQuery - However if loco_ruby does not detect the JQuery object it will automatically include it so it is not required
to be included.  If you do use JQuery just include it before you do the LocoRuby include.

##How it works##

The LocoRuby.exe is simply a webrick server that acts as bootstrap loader.  The browser makes cross browser requests to 
127.0.0.1:8000 to send the LocoRuby.exe the ruby code, which is loaded as anonymous modules.

To keep the LocoRuby.exe as simple as possible it provides nothing but the basic load capability.  Additional features 
are provided by the loco_ruby.js file which collects the application ruby scripts from the web page, and wraps it up so 
you can call eval in the context of the downloaded code.

##Simple Example##

This is a simple example that brings up a window showing the current number of bytes used on the disk, updated
every minute.

```
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
            onload: function() {update_display(); setInterval(update_display, 60*1000)}
        })

        function update_display() {
            LocoRuby.eval("bytes_free", function (r) {
                document.body.innerHTML = r
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

</body>
</html>

##LocoRuby.init Parameters##

LocoRuby.init takes a hash with the following optional keys:

* title: a string that overrides the page title
* dimensions:  a hash containing left, top, width, and height window position and size
* stay_on_top:  if true then window will be forced to stay on top of all other windows
* onload: a function that will be called once the ruby script has been loaded and is ready to go
* encrypt: a function that digests as string using SHA1.hexdigest, used for extra security checking

Examples

    LocoRuby.init({}) 
      // run the code in the current window, no security checking.  Same as LocoRuby.init()
      
    LocoRuby.init({onload: function(){alert('everything working!')}}) 
      // pop up an alert once everything is downloaded.
      
    LocoRuby.init({dimensions: {top: 50, left: 50, width: 400, height: 400}})
      // run in a new 400 X 400 popup positioned at 50, 50.  top, left, width, and height must all be supplied.
      
    LocoRuby.init({stay_on_top: true, dimensions: {top: 50, left: 50, width: 400, height: 400}})
      // run in a new popup that stays above all other windows.  stay_on_top is ignored unless dimensions are provided.
      
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
      
    LocoRuby.init({title: "My PC App"})
      // override the page title with "My PC App".



