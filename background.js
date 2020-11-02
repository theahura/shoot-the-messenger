(function() {
  chrome.extension.onMessage.addListener(function(
    request,
    sender,
    sendResponse
  ) {
    if (request.action === "REMOVE") {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      });
    } else if (request.action === "SCROLL") {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request);
      });
    } else {
      console.log("Unknown action requested: ", request.action);
    }
  });
})();
