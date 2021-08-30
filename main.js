// The sideways ellipses used to open the 'remove' menu. To the left of each
// message, generally visible on hover.
MORE_BUTTONS_HOLDER_QUERY = '[data-testid="message-container"]';
MORE_BUTTONS_QUERY = '[aria-label="More"]';

// The button used to open the remove confirmation dialog.
REMOVE_BUTTON_QUERY =
  '[aria-label="Remove message"],[aria-label="Remove Message"]';

// The button used to close the 'message removed' post confirmation.
OKAY_BUTTON_QUERY = '[aria-label="Okay"]';

// The button used to get rid of the Could Not Remove Message popup.
COULDNT_REMOVE_QUERY = '._3quh._30yy._2t_._5ixy.layerCancel';

// The button used to confirm the message removal.
REMOVE_CONFIRMATION_QUERY = '[aria-label="Unsend"],[aria-label="Remove"]';

// The holder for all of the messages in the chat.
SCROLLER_QUERY =
  '[role="main"] .buofh1pr.j83agx80.eg9m0zos.ni8dbmo4.cbu4d94t.gok29vw1';
MESSAGES_QUERY = '[aria-label=Messages]';

// The loading animation.
LOADING_QUERY = '[role="main"] svg[aria-valuetext="Loading..."]';

// The div at the very top of the message chain. This will also capture the
// text of the chat itself, so when using this to see if we hit the top make
// sure to check for TWO hits.
TOP_OF_CHAIN_QUERY =
  '.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.b0tq1wua.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.tia6h79c.fe6kdd0r.mau55g9w.c8b282yb.iv3no6db.a5q79mjw.g1cxx5fr.lrazzd5p.oo9gr5id.oqcyycmt';

// Sticker query.
STICKER_QUERY = '[aria-label$=sticker]';

// Link query.
LINK_QUERY =
  '.d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.b0tq1wua.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.hrzyx87i.jq4qci2q.a3bd9o3v.lrazzd5p.oo9gr5id.hzawbc8m';

// Thumbs up.
THUMBS_UP = '[aria-label="Thumbs up sticker"]';

// Status messages.
STATUS_MESSAGES =
  '.f2fs36ck.r9r71o1u.eagtllmd.pipptul6.oqcyycmt.km676qkl.ad2k81qe.myj7ivm5.f9o22wc5';

TIMESTAMPS = '[data-scope="date_break"]';

const STATUS = {
  CONTINUE: 'continue',
  ERROR: 'error',
  COMPLETE: 'complete',
};

let DELAY = 5;

// Helper functions ----------------------------------------------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Removal functions ---------------------------------------------------------
async function prepareDOMForRemoval() {
  // Get all ... buttons that let you select 'more' for all messages you sent.
  const elementsToUnsend = [
    ...document.querySelectorAll(MORE_BUTTONS_HOLDER_QUERY),
  ];

  // Get the elements we know we cant unsend.
  const removeQuery = `${STICKER_QUERY}, ${LINK_QUERY}, ${THUMBS_UP}`;
  const elementsToRemove = [...document.querySelectorAll(removeQuery)];

  // Status and timestamp messages are used by messenger to append messages to.
  // We cant just remove these if there are other messages that still need to
  // be appended -- otherwise, React will crash. So we'll remove these
  // 'carefully', i.e. only if there are no other messages around. See below.
  const removeCarefullyQuery = `${STATUS_MESSAGES}, ${TIMESTAMPS}`;
  const elementsToRemoveCarefully = [
    ...document.querySelectorAll(removeCarefullyQuery),
  ].filter((el) => {
    return el.style.display !== 'none';
  });

  // Once we know what to remove, start the loading process for new messages
  // just in case we lose the scroller.
  const scroller_ = document.querySelector(SCROLLER_QUERY);
  scroller_.scrollTop = 0;

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
      console.log(err);
    }
  }

  // Remove some elements carefully, by checking to see if they are surrounded
  // by siblings.
  console.log('Hiding bad rows from dom: ', elementsToRemoveCarefully);
  const elementsToRemoveCarefullyRows = elementsToRemoveCarefully.flatMap(
    (el) => {
      try {
        while (el.getAttribute('role') !== 'row') el = el.parentElement;
        return [el];
      } catch (err) {
        return [];
      }
    },
  );

  for (let row of elementsToRemoveCarefullyRows) {
    if (elementsToRemoveCarefullyRows.includes(row.nextSibling)) {
      row.remove();
    }
  }

  // Filter the elementsToUnsend list by what is still in the DOM.
  return elementsToUnsend.filter((el) => {
    return document.body.contains(el);
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

  for (el of moreButtonsHolders) {
    // Trigger on hover.
    console.log('Triggering hover on: ', el);
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(100);

    // Get the more button, unless weve clicked it too many times.
    const moreButton = document.querySelectorAll(MORE_BUTTONS_QUERY)[0];
    if (!moreButton) {
      console.log('No moreButton found! Skipping holder: ', el);
      continue;
    }
    if (moreButton.getAttribute('data-clickcount') > 5) {
      console.log('Clicked moreButton too many times, skipping holder: ', el);
      continue;
    }
    console.log('Clicking more button: ', moreButton);
    moreButton.click();

    // Update the click count on the button.
    const prevClickCount = moreButton.getAttribute('data-clickcount');
    moreButton.setAttribute(
      'data-clickcount',
      prevClickCount ? prevClickCount + 1 : 1,
    );

    // Hit the remove button to get the popup.
    await sleep(100);
    const removeButton = document.querySelectorAll(REMOVE_BUTTON_QUERY)[0];
    if (!removeButton) {
      console.log('No removeButton found! Skipping holder: ', el);
      continue;
    }
    console.log('Clicking remove button: ', removeButton);
    removeButton.click();

    // Hit unsend on the popup.
    await sleep(500);
    const unsendButton = document.querySelectorAll(
      REMOVE_CONFIRMATION_QUERY,
    )[0];
    if (!unsendButton) {
      console.log('No unsendButton found! Skipping holder: ', el);
      continue;
    }
    console.log('Clicking unsend button: ', unsendButton);
    unsendButton.click();
    await sleep(500);
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
  const scroller_ = document.querySelector(SCROLLER_QUERY);
  const topOfChainText = document.querySelector(TOP_OF_CHAIN_QUERY);
  await sleep(2000);
  if (topOfChainText.length > 1) {
    // We hit the top. Bubble this info back up.
    console.log('Reached top of chain: ', topOfChain);
    return { status: STATUS.COMPLETE };
  } else if (scroller_ && scroller_.scrollTop !== 0) {
    // Scroll up. Wait for the loader.
    let loader = null;
    scroller_.scrollTop = 0;

    for (const i = 0; i < 5; ++i) {
      console.log('Waiting for loading messages to populate...', loader);
      await sleep(2000);
      loader = document.querySelector(LOADING_QUERY);
      if (!loader) break; // Done loading when the loading animation is gone.
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
  for (let i = 0; i < count || !count; ++i) {
    console.log('Running count:', i);
    const sleepTime = await unsendAllVisibleMessages(i == count - 1);
    if (sleepTime.status === STATUS.CONTINUE) {
      console.log('Sleeping to avoid rate limits: ', sleepTime.data);
      await sleep(sleepTime.data);
    } else if (sleepTime.status === STATUS.COMPLETE) {
      return STATUS.COMPLETE;
    }
  }
  console.log('Completed run.');
  return STATUS.CONTINUE;
}

// Handlers ------------------------------------------------------------------
const currentURL =
  location.protocol + '//' + location.host + location.pathname;

async function removeHandler(tabId) {
  const status = await runner(25);
  if (status.status === STATUS.COMPLETE) {
    console.log(
      'Possibly successfully removed all messages. Running one more confirmation attempt.',
    );
    chrome.runtime.sendMessage({
      action: 'STORE',
      data: { [currentURL]: { confirmSuccess: true } },
      response: { tabId: tabId, action: 'RELOAD' },
    });
  } else if (status.status === STATUS.CONTINUE) {
    console.log('Completed runner iteration but did not finish removal.');
    chrome.runtime.sendMessage({
      action: 'STORE',
      data: { [currentURL]: { isRemoving: true } },
      response: { tabId: tabId, action: 'RELOAD' },
    });
  } else {
    console.log('Failed to complete longChain removal.');
  }
}

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
    const tabId = msg.tabId;
    if (msg.action === 'REMOVE') {
      const doRemove = confirm(
        'Removal will nuke your messages and will prevent you from seeing the messages of other people in this chat. We HIGHLY recommend backing up your messages first. Continue?',
      );
      if (doRemove) {
        removeHandler(tabId);
      } else {
        chrome.runtime.sendMessage({
          action: 'STOP',
        });
      }
    } else if (msg.action === 'CONFIRM_SUCCESS') {
      await sleep(10000);
      const maybeSuccess = runner(3);
      if (maybeSuccess.status === STATUS.CONTINUE) {
        chrome.runtime.sendMessage({
          action: 'STORE',
          data: { [currentURL]: { isRemoving: true } },
        });
        removeHandler(tabId);
      } else if (maybeSuccess.status === STATUS.COMPLETE) {
        console.log('Successful confirmation! All cleared!');
        chrome.runtime.sendMessage({
          action: 'STORE',
          data: { [currentURL]: { lastCleared: new Date().toDateString() } },
        });
      } else {
        console.log('Got error during confirmation attempt. Failing.');
        chrome.runtime.sendMessage({
          action: 'STORE',
          data: { [currentURL]: { isRemoving: true } },
          response: { tabId: tabId, action: 'RELOAD' },
        });
      }
    } else if (msg.action === 'RELOAD') {
      window.location = window.location.pathname;
    } else if (msg.action === 'UPDATE_DELAY') {
      console.log('Setting delay to', msg.data, 'seconds');
      DELAY = msg.data;
    } else {
      console.log('Unknown action.');
    }
  });

  // Check to see if we need to kick off a removal request.
  console.log('Checking existing removal process.');
  chrome.runtime.sendMessage({
    action: 'CHECK_ALREADY_REMOVING',
  });
})();
