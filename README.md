#LocoRuby (easily run local ruby code in a windows browser)#

LocoRuby is a simple way to include `<script type="text/ruby">...</script>` blocks on a 
page and execute the code in the local windows environment.

##Why?##

Your ruby project (rails, sinatra whatever) mainly runs as a browser application, but also needs to run a little 
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

* Simple to setup:  Only requirement is that the local machine is running the LocoRuby.exe, and include ruby_local.js
* Runs in the browser, write normal HTML / Javascript
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
Loading Application... If this message does not go away, then check to see that your browser is not blocking popups.
</body>
</html>
```
##LocoRuby.init Parameters##

LocoRuby.init takes a hash with the following optional keys:

* title: a string that overrides the page title
* dimensions:  a hash containing left, top, width, and height window position and size
* stay_on_top:  if true then window will be forced to stay on top of all other windows
* onload: a function that will be called once the ruby script has been loaded and is ready to go
* encrypt: a function that digests as string using SHA1.hexdigest, used for extra security checking

###Examples###

```javascript
LocoRuby.init({}) 
      // run the code in the current window, no security checking.  Same as LocoRuby.init()  
      
LocoRuby.init({title: "My PC App"})
      // override the page title with "My PC App".

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

```

##Popup Window Management##

One of the features of LocoRuby is that you can create simple windows dialogs that run in the browser, but act like 
stand alone windows applications.

The trigger for this capability is providing dimensions to the init function.  This lets LocoRuby know that a new
dialog window is desired.

To accomplish this LocoRuby reloads the current page into a newly created browser popup, 
which is then sized and optionally forced to stay on top.

Once this is done, we want to get rid of the original browser window, so we either do a back `(history(-1))` or if there
is no history then just close the original browser window (more on why below.)

Because LocoRuby is not set up to deal nicely with multiple windows running the same "application" it also makes sure
that any existing popups (of the same application name) are closed before calling onload.

While all this seems complicated it gives a nice user experience.  You can create an application links page
that links to your LocoRuby popup pages.  When the link is followed the LocoRuby page will be loaded in the same browser 
window, but then a popup will come up, and the parent window will go back to the original page, thus the popup acts
like target="_BLANK", but where you can control the size of the new window.

You can also create a windows short-cut where the target is the LocoRuby page.  In this case when a user opens the 
short-cut a new browser window with no history is created, in which the LocoRuby code will begin to run.  
Once the popup is created the original window (with no history) an be deleted. 

##Security##

If you want to add additional security you can set up a key on both your server and the local machine.  You must 
provide a digest function on your server that matches the digest in LocalRuby.

1. On the local machine launch RubyLocal with the `--key your_key` option.  I.e. `RubyLoco --key myspecialkey`
2. On the server provide a service to digest a string
like this `Digest::SHA1.hexdigest("--#{your_key}--#{some_string}--")` 
I.e. `Digest::SHA1.hexdigest("--myspecialkey--#{s}--")`
3. Provide an encrypt function to LocalRuby.init.  The function takes a string and a call back.  Make an ajax call to your 
server routine to encrypt the string and return the digested string.

##Credits##

Lars Christensen for the Ocra Gem used to create the executable
Robert Wahler for the auto-gui gem which is included and makes controlling window's gui apps easy

Also included is the FxRuby gem in case you need to create a richer windows GUI


