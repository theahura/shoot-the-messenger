(function () {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!("action" in request)) {
      console.log("No action found in contentHandler.");
      return;
    }
    console.log("Got request: ", request);

    if (request.action === "STORE") {
      // Store in local storage.
      console.log("Got store request for: ", request.data);
      chrome.storage.local.set(request.data, () => {
        if (request.response) {
          chrome.tabs.sendMessage(sender.tab.id, request.response);
        }
      });
    } else if (request.action === "DELETE") {
      // Remove from localstorage.
      console.log("Got delete request for: ", request.data);
      chrome.storage.local.remove(request.data, () => {
        if (request.response) {
          chrome.tabs.sendMessage(sender.tab.id, request.response);
        }
      });
    } else if (request.action === "REMOVE") {
      // Begin removing message information.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { tabId: tabs[0].id, ...request });
      });
    } else if (request.action === "SCROLL") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { tabId: tabs[0].id, ...request });
      });
    } else if (request.action === "STOP") {
      // Clear the storage cache and then trigger a reload. By clearing the
      // cache first, we make sure we do not trigger additional removal on this
      // page without confirmation.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.storage.local.set({ [tabs[0].url]: {} }, () => {
          chrome.tabs.sendMessage(tabs[0].id, {
            tabId: tabs[0].id,
            action: "RELOAD",
          });
        });
      });
    } else if (request.action === "CHECK_ALREADY_REMOVING") {
      if (sender.tab && sender.tab.active) {
        // If we have a refresh on a tab that we're currently removing data from,
        // restart the data removal. Otherwise, check local storage to see if we
        // have previously stored info there.
        chrome.storage.local.get([sender.tab.url], (result) => {
          if (!result || Object.keys(result).length === 0) return;
          console.log("Found storage for url: ", result);
          if ("isRemoving" in result[sender.tab.url]) {
            chrome.tabs.sendMessage(sender.tab.id, {
              tabId: sender.tab.id,
              action: "REMOVE",
            });
          } else if ("confirmSuccess" in result[sender.tab.url]) {
            chrome.tabs.sendMessage(sender.tab.id, {
              tabId: sender.tab.id,
              action: "CONFIRM_SUCCESS",
            });
          }
        });
      }
    } else {
      console.log("Unknown action requested: ", request.action);
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {});
})();
