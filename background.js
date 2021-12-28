(function () {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!('action' in request)) {
      console.log('No action found in contentHandler.');
      return;
    }
    console.log('Got request: ', request);

    if (request.action === 'REMOVE') {
      // Begin removing message information.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { tabId: tabs[0].id, ...request });
      });
    } else if (request.action === 'STOP') {
      // We can stop by just triggering a reload.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          tabId: tabs[0].id,
          action: 'STOP',
        });
      });
    } else {
      console.log('Unknown action requested: ', request.action);
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {});
})();
