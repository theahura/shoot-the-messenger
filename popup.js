document.getElementById("RemoveMessages").addEventListener("click", () => {
  chrome.extension.sendMessage({
    action: "REMOVE"
  });
});

document.getElementById("ScrollToBottom").addEventListener("click", () => {
  chrome.extension.sendMessage({
    action: "SCROLL"
  });
});

document.getElementById("Stop").addEventListener("click", () => {
  chrome.extension.sendMessage({
    action: "STOP"
  });
});

// If the active tab was previously cleared, update the popup with the info.
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  chrome.storage.local.get([tabs[0].url], result => {
    if (!result || Object.keys(result).length === 0) return;
    console.log("Found storage for url: ", result);
    document.getElementById("LastCleared").innerHTML =
      "Last Cleared: " + result[tabs[0].url]["lastCleared"];
  });
});
