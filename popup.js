document.getElementById('RemoveMessages').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    action: 'REMOVE',
  });
});

document.getElementById('Stop').addEventListener('click', () => {
  chrome.runtime.sendMessage({
    action: 'STOP',
  });
});

// If the active tab was previously cleared, update the popup with the info.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.storage.local.get([tabs[0].url], (result) => {
    if (!result || Object.keys(result).length === 0) return;
    console.log('Found storage for url: ', result);
    if ('lastCleared' in result[tabs[0].url]) {
      document.getElementById('LastCleared').innerHTML =
        'Last Cleared: ' + result[tabs[0].url]['lastCleared'];
    }
  });
});

// Make sure the user is using messenger.com.
const messengers = [
  'https://www.messenger.com',
  'http://www.messenger.com',
  'https://messenger.com/',
  'http://messenger.com/',
];
chrome.tabs.query(
  {
    active: true,
    currentWindow: true,
  },
  (tabs) => {
    const url = tabs[0].url;
    if (!messengers.some((m) => url.startsWith(m))) {
      alert(
        `ERROR: Shoot the Messenger must be used on messenger.com, currently on ${url}. This extension will not work as intended.`,
      );
    }
  },
);

document.getElementById('Delay').addEventListener('input', (e) => {
  chrome.runtime.sendMessage({
    action: 'UPDATE_DELAY',
    data: e.target.value,
  });
});

// Send over defaults to clear whatever the prior state is from local storage.
chrome.runtime.sendMessage({
  action: 'UPDATE_DELAY',
  data: document.getElementById('Delay').value,
});
