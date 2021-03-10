![Shoot the Messenger Icon](/icon.png)

### Buy me a coffee: venmo @Amol-Kapoor

# Shoot the Messenger

Shoot the Messenger is a Chrome extension that automatically unsends every message you have in a messenger chain. Open a messenger thread, hit 'Remove Messages', and go get a coffee. While you're gone, the extension will click on every 'unsend message' button, leaving behind a trail of nothing.

  <img src="redacted.png" alt="Removed messages with Shoot the Messenger" width="400"/>

This extension will remove your messages, but it will also delete the messages of everyone else in the messenger chain. I HIGHLY recommend backing up your messenger data before using this extension.

The extension is currently waiting approval on the Web Store. In the meantime, you can git clone the repo and install it as an unpacked extension. You can see how here: https://developer.chrome.com/docs/extensions/mv2/getstarted/

### The short installation guide.
1) Clone or download the code in this repo somewhere on your computer. 
2) Go to chrome://extensions and hit developer mode on the top right.
3) Hit load unpacked, and then select the directory where you downloaded the code from this repo. 
4) If you did everything right, the shoot the messenger logo should appear in your extension list.
5) Go to messenger.com and click on a thread you want to delete. Click the extension, hit remove, and hopefully things happen.

Updates will be posted to twitter here: [@theahura_](https://twitter.com/theahura_)

### Misc notes.

NOTE: while for the most part unsending messages does not result in notifications for the other party, some iPhone users reported getting a lot of notifications as messages were being removed. The content of the message was not present. Specifically, I've had friends with Messenger v291.2+ on iPhone getting notifications when messages are removed. Unfortunately, because of the nature of Shoot the Messenger, this can result in a lot of inadvertent spam sent to Facebook friends. As far as I can tell, notifications are NOT sent if you are removing messages from a thread where the other person is NOT your facebook friend. None of this applies to android users.

NOTE: not all messages can be unsent. For example, I've been unable to remove some messages with links in them, and stickers give a lot of trouble. This isn't a problem with the extension, so much as a problem with Facebooks removal backend.

NOTE: facebook constantly runs A/B tests, some of which may break this extension. File an issue if something weird happens -- or more likely, doesn't happen.
