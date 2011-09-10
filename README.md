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

Instead wouldn't it be nice if you could just run your script in the browser?  Now your code is written in as a 
normal view, with some ruby snippets to handle the code that has to execute on the local machine.  Your code is
now part of your larger application, and is deployed via the browser.

##Features##

* Simple to setup:  Only requirement is that the local machine is running the LocoRuby.exe
* Works in any browser
* Add `<script type="text/ruby">` blocks to your pages, and then execute `local_ruby_eval(....)` from javascript
* Tested in Windows XP and 7 (testing on Vista would be appreciated!)
* Includes Ruby Debug and Logger for debugging and logging 
* Includes auto-gui gem to easily drive windows applications
* Includes FxRuby gem for creating local GUIs (or just use the browser)


##Sample Applications##

* Control of windows applications that don't have APIs
* Need to run a ruby script locally on a windows machine, 
