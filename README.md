# remove-fb-messenger
Script to auto-unsend all messages from a facebook messenger chat.

Tested in chrome. 

HOWTO:

Run the little function in remove-messages.js in a chrome dev console by copy pasting the function in, then calling the function by typing unsendAllVisibleMessages().

Depending on how long the message chain is, it may take a while...consider leaving it running over night. Eventually if you come back and you've reached the top of the message chain, you can refresh the page to stop the script.

It's possible that the CSS selectors that are being used in this little script need to be changed -- if something crashes, just check out the underlying html to make sure the selectors are right. Sometimes the script will bubble up an error, likely because something is being loaded or something. Just let it run through. 
