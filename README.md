# NOTE: Shoot the Messenger is currently broken.
Facebook's latest UI change to the desktop messenger removed the 'search in conversation' feature. This feature is the core backbone of Shoot the Messenger -- the extension uses 'search in conversation' to continuously load older and older messages without running into memory issues. Currently looking for a way to get around this problem, but right now it's looking grim. 

![Shoot the Messenger Icon](/icon.png)

# Shoot the Messenger

Shoot the Messenger is a Chrome extension that automatically unsends every message you have in a messenger chain. Open a messenger thread, hit 'Remove Messages', and go get a coffee. While you're gone, the extension will click on every 'unsend message' button, leaving behind a trail of nothing.

<img src="redacted.png" alt="Removed messages with Shoot the Messenger" width="400"/>

The extension is currently waiting approval on the Web Store. In the meantime, you can git clone the repo and install it as an unpacked extension. You can see how here: https://developer.chrome.com/docs/extensions/mv2/getstarted/

NOTE: while for the most part unsending messages does not result in notifications for the other party, some iPhone users reported getting a lot of notifications as messages were being removed. The content of the message was not present. It's not clear when this happens or why -- some users report getting the notifications, some do not. Use at your own risk. Specifically, I've had friends with Messenger v291.2+ on iPhone getting notifications when messages are removed. But it's not all of them, so it may be an A/B test.

NOTE: not all messages can be unsent. For example, I've been unable to remove messages with links in them. I don't know why FB doesn't let these messages unsend, but either way it's not an issue of the extension.
