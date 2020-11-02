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
