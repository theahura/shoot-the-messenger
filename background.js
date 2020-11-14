(function() {
  TEMP_STORE = {};

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!("action" in request)) {
      console.log("No action found in contentHandler.");
      return;
    }

    if (request.action === "STORE") {
      console.log("Got store request for: ", request.data);
      chrome.storage.local.set(request.data, () => {
        if (request.response) {
          chrome.tabs.sendMessage(sender.tab.id, request.response);
        }
      });
    } else if (request.action === "DELETE") {
      console.log("Got delete request for: ", request.data);
      chrome.storage.local.remove(request.data, () => {
        if (request.response) {
          chrome.tabs.sendMessage(sender.tab.id, request.response);
        }
      });
    } else if (request.action === "TEMP_STORE") {
      console.log("Got temp store request for: ", request.data);
      TEMP_STORE = { ...TEMP_STORE, ...request.data };
      if (request.response) {
        chrome.tabs.sendMessage(sender.tab.id, request.response);
      }
    } else if (request.action === "TEMP_DELETE") {
      console.log("Got temp delete request for: ", request.data);
      delete TEMP_STORE[request.data];
      if (request.response) {
        chrome.tabs.sendMessage(sender.tab.id, request.response);
      }
    } else if (request.action === "REMOVE") {
      // Begin removing information. If the tab responds, pass that along to our
      // contentHandler.
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { tabId: tabs[0].id, ...request });
      });
    } else if (request.action === "SCROLL") {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, { tabId: tabs[0].id, ...request });
      });
    } else if (request.action === "STOP") {
      // Clear the storage cache and then trigger a reload. By clearing the
      // cache first, we make sure we do not trigger additional removal on this
      // page.
      delete TEMP_STORE[tabs[0].id];
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, {
          tabId: tabs[0].id,
          action: "RELOAD"
        });
      });
    } else if (request.action === "CHECK_ALREADY_REMOVING") {
      // If we have a refresh on a tab that we're currently removing data from,
      // restart the data removal with the new searchText provided.
      if (
        sender.tab &&
        sender.tab.active &&
        sender.tab.id in TEMP_STORE &&
        Object.keys(TEMP_STORE[sender.tab.id]).length !== 0
      ) {
        console.log(
          "Tab reloaded, sending removal request again: ",
          sender.tab.url,
          TEMP_STORE[sender.tab.id]
        );
        chrome.tabs.sendMessage(sender.tab.id, {
          tabId: sender.tab.id,
          action: "REMOVE",
          prevSearchText: TEMP_STORE[sender.tab.id]
        });
      }
    } else {
      console.log("Unknown action requested: ", request.action);
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {});
})();
