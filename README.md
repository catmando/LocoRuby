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

You are building a public application where its not practical to ask users to install the LocoRuby.exe
You are a JRuby shop (in which case there are easier ways to do this by creating JRuby applets)
The local environment is MacOS

##Features##

* Simple to setup:  Only requirement is that the local machine is running the LocoRuby.exe
* Works in any browser
* Add `<script type="text/ruby">` blocks to your pages, and then execute `local_ruby_eval(....)` from javascript
* Tested in Windows XP and 7 (testing on Vista would be appreciated!)
* Includes Ruby Debug and Logger for debugging and logging 
* Includes auto-gui gem to easily drive windows applications
* Includes FxRuby gem for creating local GUIs (or just use the browser)
* Secure  (let me know if you see any security holes, but I don't see any)


##Sample Applications##

* Control of legacy windows applications that don't have APIs
* Manipulate files on the local machine
* Manufacturing floor device control

##How it works##

The LocoRuby.exe is simply a webrick server that acts as bootstrap loader.  The browser makes cross browser calls to 
127.0.0.1:8000 to send the LocoRuby.exe code files.

Bundled in with the LocoRuby.exe are nice to haves such as support for Ruby Debug, Logging, and ability to provide
status via a LocoRuby system tray icon.

Also bundled into the exe is (hopefully) every thing you will ever need on the local machine in the way of gems:  The
complete ruby standard library; FxRuby gui framework; and a nice gem called auto-gui that makes driving the local 
windows gui snap.

##Server-side code##


