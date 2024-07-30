// The div at the very top of the message chain. This is the div holding the description
// of the person your chatting with. Example as follows
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=
// User Image
// User Name
// You're friends on facebook
// Lives in {city/state}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=
TOP_OF_CHAIN_QUERY = '.xsag5q8.xn6708d.x1ye3gou.x1cnzs8';

// Remove Queries -------------------------------------------------------------
MY_ROW_QUERY = '.x78zum5.xdt5ytf.x193iq5w.x1n2onr6.xuk3077:has(> span)'; // Also used for finding the scroller (we just go up to the first parent w/ scrollTop)

// Partner chat text innerText, used for searching
PARTNER_CHAT_QUERY =
  '.html-div.xe8uvvx.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x1gslohp.x11i5rnm.x12nagc.x1mh8g0r.x1yc453h.x126k92a.x18lvrbx';

// In case a user has none of their own messages on screen and only unsent messages, this serves to pick up the scroll parent
UNSENT_MESSAGE_QUERY =
  '.xevjqck.x14xiqua.x10nbalq.x1fum7jp.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.xlh3980.xvmahel.x12ovt74.x1kfpmh.x3u9vk4.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.xtc0289.xdmd9no';

// The sideways ellipses used to open the 'remove' menu. Visible on hover.
MORE_BUTTONS_QUERY = '[aria-label="More"]';

// The button used to open the remove confirmation dialog.
REMOVE_BUTTON_QUERY =
  '[aria-label="Remove message"],[aria-label="Remove Message"]';

// The button used to close the 'message removed' post confirmation.
OKAY_BUTTON_QUERY = '[aria-label="Okay"]';

COULDNT_REMOVE_QUERY = '._3quh._30yy._2t_._5ixy.layerCancel';
REMOVE_CONFIRMATION_QUERY = '[aria-label="Unsend"],[aria-label="Remove"]';
CANCEL_CONFIRMATION_QUERY =
  '[aria-label="Who do you want to remove this message for?"] :not([aria-disabled="true"])[aria-label="Cancel"]';

// The loading animation.
LOADING_QUERY = '[role="main"] svg[aria-valuetext="Loading..."]';

// Things we cannot delete for unknown reasons.
STICKER_QUERY = '[aria-label$=sticker]';
LINK_QUERY =
  '.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.b0tq1wua.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.hrzyx87i.jq4qci2q.a3bd9o3v.lrazzd5p.oo9gr5id.hzawbc8m';
THUMBS_UP = '[aria-label="Thumbs up sticker"]';

// Search Queries -------------------------------------------------------------
CONVERSATION_INFO_QUERY = '[aria-label="Conversation information"]';
SEARCH_TOGGLE_QUERY = '[aria-label="Search"]';
SEARCH_BAR_QUERY = '[placeholder="Search in conversation"]';
MATCHES_QUERY = 'div[role="button"] img';

// Consts and Params.
const STATUS = {
  CONTINUE: 'continue',
  ERROR: 'error',
  COMPLETE: 'complete',
};

let DELAY = 10;
const RUNNER_COUNT = 10;
const NUM_WORDS_IN_SEARCH = 6;
const MIN_SEARCH_LENGTH = 20;
const DEBUG_MODE = false; // When set, does not actually remove messages.

const currentURL =
  location.protocol + '//' + location.host + location.pathname;
const searchMessageKey = 'shoot-the-messenger-last-message' + currentURL;
const lastClearedKey = 'shoot-the-messenger-last-cleared' + currentURL;

let scrollerCache = null;
const clickCountPerElement = new Map();

// Helper functions ----------------------------------------------------------
function getRandom(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sleep(ms) {
  let randomizedSleep = getRandom(ms, ms * 1.33);
  return new Promise((resolve) => setTimeout(resolve, randomizedSleep));
}

function reload() {
  window.location = window.location.pathname;
}

function getScroller() {
  if (scrollerCache) return scrollerCache;

  let el;
  try {
    const query = `${MY_ROW_QUERY}, ${PARTNER_CHAT_QUERY}, ${UNSENT_MESSAGE_QUERY}`;
    el = document.querySelector(query);
    while (!('scrollTop' in el) || el.scrollTop === 0) {
      console.log('Traversing tree to find scroller...', el);
      el = el.parentElement;
    }
  } catch (e) {
    alert(
      'Could not find scroller. This normally happens because you do not ' +
        'have enough messages to scroll through. Failing.',
    );
    console.log('Could not find scroller; failing.');
    throw new Error('Could not find scroller.');
  }

  scrollerCache = el;
  return el;
}

function setNativeValue(element, value) {
  // See https://stackoverflow.com/a/53797269/3269537.
  // and https://github.com/facebook/react/issues/10135#issuecomment-401496776
  const valueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    'value',
  ).set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    'value',
  ).set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }

  element.dispatchEvent(new Event('input', { bubbles: true }));
}

async function submitSearch() {
  // We need to do this in a separate script in the main context. See:
  // https://stackoverflow.com/a/9517879/3269537
  // This is because we need access to specific react properties, which in turn
  // are only available on the main context.
  //
  // Unfortunately that also means this function has to be highly specific to
  // the search behavior.
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('./submitSearch.js');
  s.dataset.params = JSON.stringify({ searchBarQuery: SEARCH_BAR_QUERY });
  s.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}

// Removal functions ---------------------------------------------------------
async function prepareDOMForRemoval() {
  // TODO: filter to only your messages.

  // Get all ... buttons that let you select 'more' for all messages you sent.
  const elementsToUnsend = [...document.querySelectorAll(MY_ROW_QUERY)];

  // Get the elements we know we cant unsend.
  const removeQuery = `${STICKER_QUERY}, ${LINK_QUERY}, ${THUMBS_UP}`;
  const elementsToRemove = [...document.querySelectorAll(removeQuery)];

  // Add the elements from clickCountPerElement where the count is greater than
  // 3 to elementsToRemove.
  for (let [el, count] of clickCountPerElement) {
    if (count > 3) {
      console.log('Unable to unsend element: ', el);
      elementsToRemove.push(el);
    }
  }

  // Once we know what to remove, start the loading process for new messages
  // just in case we lose the scroller.
  getScroller().scrollTop = 0;

  // We cant delete all of the elements because react will crash. Keep the
  // first one.
  elementsToRemove.shift();
  elementsToRemove.reverse();
  console.log('Removing bad rows from dom: ', elementsToRemove);
  for (let badEl of elementsToRemove) {
    await sleep(100);
    let el = badEl;
    try {
      while (el.getAttribute('role') !== 'row') el = el.parentElement;
      el.remove();
    } catch (err) {
      console.log('Skipping row: could not find the row attribute.');
    }
  }

  // Filter the elementsToUnsend list by what is still in the DOM.
  return elementsToUnsend.filter((el) => {
    return (
      el.innerText !== 'You unsent a message' && document.body.contains(el)
    );
  });
}

async function unsendAllVisibleMessages(isLastRun) {
  // Prepare the DOM. Get the elements we can remove. Load the next set. Hide
  // the rest.
  const moreButtonsHolders = await prepareDOMForRemoval();

  // Drop the first element in the list, because react needs something to load
  // more messages onto.
  moreButtonsHolders.shift();
  console.log('Found hidden menu holders: ', moreButtonsHolders);

  // Reverse list so it steps through messages from bottom and not a seemingly
  // random position.
  for (el of moreButtonsHolders.slice().reverse()) {
    // Keep current task in view, as to not confuse users, thinking it's not
    // working anymore.
    el.scrollIntoView();
    await sleep(100);

    // Trigger on hover.
    console.log('Triggering hover on: ', el);
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(150);

    // Get the more button.
    const moreButton = document.querySelectorAll(MORE_BUTTONS_QUERY)[0];
    if (!moreButton) {
      console.log('No moreButton found! Skipping holder: ', el);
      continue;
    }
    console.log('Clicking more button: ', moreButton);
    moreButton.click();

    // Update the click count for the button. This is used to skip elements
    // that refuse to be unsent (see: prepareDOMForRemoval -- we remove these
    // DOM elements there).
    clickCountPerElement.set(el, (clickCountPerElement.get(el) ?? 0) + 1);

    // Hit the remove button to get the popup.
    await sleep(200);
    const removeButton = document.querySelectorAll(REMOVE_BUTTON_QUERY)[0];
    if (!removeButton) {
      console.log('No removeButton found! Skipping holder: ', el);
      continue;
    }
    console.log('Clicking remove button: ', removeButton);
    removeButton.click();

    // Hit unsend on the popup. If we are in debug mode, just log the popup.
    await sleep(1000);
    const unsendButton = document.querySelectorAll(
      REMOVE_CONFIRMATION_QUERY,
    )[0];
    const cancelButton = document.querySelectorAll(
      CANCEL_CONFIRMATION_QUERY,
    )[0];
    if (DEBUG_MODE) {
      console.log(
        'Skipping unsend because we are in debug mode.',
        unsendButton,
      );
      cancelButton.click();
      continue;
    } else if (!unsendButton) {
      console.log('No unsendButton found! Skipping holder: ', el);
      cancelButton.click();
      continue;
    }
    console.log('Clicking unsend button: ', unsendButton);
    unsendButton.click();
    await sleep(1800);
  }
  console.log('Removed all holders.');

  // If this is the last run before the runner cycle finishes, dont keep
  // scrolling up.
  if (isLastRun) {
    if (moreButtonsHolders.length === 0) {
      return { status: STATUS.CONTINUE, data: 100 };
    } else {
      return { status: STATUS.CONTINUE, data: DELAY * 1000 };
    }
  }

  // Now see if we need to scroll up.
  const scroller_ = getScroller();
  const topOfChainText = document.querySelectorAll(TOP_OF_CHAIN_QUERY);
  const elementsToUnsend = [...document.querySelectorAll(MY_ROW_QUERY)];
  console.log(
    'topOfChain = ',
    topOfChainText.length,
    ' elementToUnsend = ',
    elementsToUnsend.length,
  );
  await sleep(2000);
  if (topOfChainText.length == 1 && elementsToUnsend.length <= 1) {
    // We hit the top. Bubble this info back up.
    console.log('Reached top of chain: ', topOfChainText);
    return { status: STATUS.COMPLETE };
  } else if (scroller_ && scroller_.scrollTop !== 0) {
    // Scroll up. Wait for the loader.
    // Were done loading when the loading animation is gone, or when the loop
    // waits 5 times (10s).
    let loader = null;
    scroller_.scrollTop = 0;

    for (let i = 0; i < 5; ++i) {
      console.log('Waiting for loading messages to populate...', loader);
      await sleep(2000);
      loader = document.querySelector(LOADING_QUERY);
      if (!loader) break;
    }
  } else {
    // Something is wrong. We dont have load more OR scrolling, but we havent
    // hit the top either.
    console.log(
      'No scroller or load buttons, but we didnt hit the top. Failing.',
    );
    return { status: STATUS.ERROR };
  }

  // And then run the whole thing again after 500ms for loading if we didnt
  // have any removals (to zoom up quickly), or 5s if we did have removals to
  // avoid any rate limiting.
  if (moreButtonsHolders.length === 0) {
    return { status: STATUS.CONTINUE, data: 100 };
  } else {
    return { status: STATUS.CONTINUE, data: DELAY * 1000 };
  }
}

async function runner(count) {
  console.log('Starting runner removal for N iterations: ', count);
  for (let i = 0; i < count; ++i) {
    console.log('Running count:', i);
    const sleepTime = await unsendAllVisibleMessages(i === count - 1);
    if (sleepTime.status === STATUS.CONTINUE) {
      console.log('Sleeping to avoid rate limits: ', sleepTime.data / 1000);
      await sleep(sleepTime.data);
    } else if (sleepTime.status === STATUS.COMPLETE) {
      return STATUS.COMPLETE;
    } else {
      return STATUS.ERROR;
    }
  }
  console.log('Completed run.');
  return STATUS.CONTINUE;
}

// Search functions ---------------------------------------------------------

async function runSearch(searchMessage) {
  // Open the search bar.
  const convInfoButton = document.querySelectorAll(CONVERSATION_INFO_QUERY)[0];

  if (convInfoButton.attributes['aria-expanded'].value === 'false') {
    convInfoButton.click();
    await sleep(3000);
  }

  let searchBar = document.querySelectorAll(SEARCH_BAR_QUERY)[0];
  if (!searchBar) {
    document.querySelectorAll(SEARCH_TOGGLE_QUERY)[0].click();
    await sleep(2000);
    searchBar = document.querySelectorAll(SEARCH_BAR_QUERY)[0];
  }

  if (!searchBar) {
    console.log('Could not load search bar. Failing.');
    return false;
  }

  console.log('Found searchBar', searchBar);
  setNativeValue(searchBar, searchMessage);
  searchMessage = searchMessage.trim().replaceAll(" +", " ")
  console.log('searchMessage: ' + searchMessage);
  await submitSearch();
  await sleep(3000);

  const matches = [...document.querySelectorAll(MATCHES_QUERY)]
  console.log('Found ' + matches.length + ' matches: ', matches);
  try {
    for (let i = 0; i <= matches.length; ++i) {
      match = matches[i].parentElement.parentElement.parentElement
      console.log('match [' + i + ']': ' + match.lastChild.lastChild.lastChild.lastChild.lastChild.firstChild.innerText);
      if (match.lastChild.lastChild.lastChild.lastChild.lastChild.firstChild.innerText === searchMessage) {
        match.click(); 
        return true;
      }
    }
  }
  catch (err) {
    console.log('No search results. Skipping.');
  }

  await sleep(3000);

  return false;
}

async function getSearchableMessage(prevMessage) {
  const availableMessages = [
    ...document.querySelectorAll(PARTNER_CHAT_QUERY),
  ].map((n) => n.innerText);

  // Find a message that wasnt the previous message, with at least five words,
  // with no foreign characters allowed, where the total message length is
  // at least 20ch.
  var pattern = /^[a-z0-9\s.,?!]+$/i;
  const filtered = availableMessages.filter((t) => {
    return (
      t !== prevMessage &&
      t.split(/\s+/).length >= NUM_WORDS_IN_SEARCH &&
      pattern.test(t) &&
      t.length >= MIN_SEARCH_LENGTH
    );
  });

  // For each available message, validate that it would be a good search from
  // top to bottom.
  for (const message of filtered) {
    // Run the search.
    console.log('Testing candidate message: ', message);
    if (runSearch(message)) return message;
  }

  // Could not find a good searchable message. Realistically, this should be
  // very rare.
  return null;
}

function hijackLog() {
  // Add a log to the bottom left of the screen where users can see what the
  // system is thinking about.
  console.log('Adding log to screen');
  const log = document.createElement('div');
  log.id = 'log';
  log.style.position = 'fixed';
  log.style.bottom = '0';
  log.style.left = '0';
  log.style.backgroundColor = 'white';
  log.style.padding = '10px';
  log.style.zIndex = '10000';
  log.style.maxWidth = '200px';
  log.style.maxHeight = '500px';
  log.style.overflow = 'scroll';
  log.style.border = '1px solid black';
  log.style.fontSize = '12px';
  log.style.fontFamily = 'monospace';
  log.style.color = 'black';
  document.body.appendChild(log);

  // Hijack the console.log function to also append to our new log element.
  const oldLog = console.log;
  console.log = function () {
    oldLog.apply(console, arguments);
    log.innerText += '\n' + Array.from(arguments).join(' ');
    log.scrollTop = log.scrollHeight;
  };
  console.log('Successfully added log to screen');
  console.log(
    'To see more complete logs, hit f12 or open the developer console.',
  );
  return log;
}

// Handlers ------------------------------------------------------------------
async function removeHandler() {
  hijackLog();

  console.log('Sleeping to allow the page to load fully...');
  await sleep(10000); // give the page a bit to fully load.

  const maybeSearchMessage = localStorage.getItem(searchMessageKey);
  if (maybeSearchMessage) {
    console.log(
      'Attempting to run search with message : ',
      maybeSearchMessage,
    );
    if (!(await runSearch(localStorage.getItem(searchMessageKey)))) {
      alert(`Unable to find message: ${maybeSearchMessage}. Failing.`);
      return null;
    }
  }

  const status = await runner(RUNNER_COUNT);

  if (status === STATUS.COMPLETE) {
    localStorage.removeItem(searchMessageKey);
    localStorage.setItem(lastClearedKey, new Date().toString());
    console.log('Success!');
    alert('Successfully cleared all messages!');
    return null;
  } else if (status === STATUS.CONTINUE) {
    console.log('Completed runner iteration but did not finish removal.');
    const lastSearched = localStorage.getItem(searchMessageKey);
    const searchableMessage = await getSearchableMessage(lastSearched);
    if (searchableMessage) {
      console.log('Going to search for: ', searchableMessage);
      localStorage.setItem(searchMessageKey, searchableMessage);
      return reload();
    } else {
      console.log('Could not find searchable message...');
    }
  }

  console.log('Failed to complete removal.');
  alert('ERROR: something went wrong. Failed to complete removal.');
}

// Main ----------------------------------------------------------------------

// Hacky fix to avoid issues with removing/manipulating the DOM from outside
// react control.
// See: https://github.com/facebook/react/issues/11538#issuecomment-417504600
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) {
        console.error(
          'Cannot remove a child from a different parent',
          child,
          this,
        );
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) {
        console.error(
          'Cannot insert before a reference node from a different parent',
          referenceNode,
          this,
        );
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

(async function () {
  chrome.runtime.onMessage.addListener(async function (msg, sender) {
    // Make sure we are using english language messenger.
    if (document.documentElement.lang !== 'en') {
      alert(
        'ERROR: detected non-English language. Shoot the Messenger only works when Facebook settings are set to English. Please change your profile settings and try again.',
      );
      return;
    }

    console.log('Got action: ', msg.action);
    if (msg.action === 'REMOVE') {
      const doRemove = confirm(
        'Removal will nuke your messages and will prevent you from seeing the messages of other people in this chat. We HIGHLY recommend backing up your messages first. Continue?',
      );
      if (doRemove) {
        removeHandler();
      }
    } else if (msg.action === 'STOP') {
      localStorage.removeItem(searchMessageKey);
      reload();
    } else if (msg.action === 'UPDATE_DELAY') {
      console.log('Setting delay to', msg.data, 'seconds');
      DELAY = msg.data;
    } else {
      console.log('Unknown action.');
    }
  });

  // TODO: Check to see if we need to kick off a removal request.
  if (localStorage.getItem(searchMessageKey)) {
    removeHandler();
  }
})();
