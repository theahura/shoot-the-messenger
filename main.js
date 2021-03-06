// The sideways ellipses used to open the 'remove' menu. To the left of each
// message, generally visible on hover.
MORE_BUTTONS_HOLDER_QUERY =
  '[data-testid="outgoing_group"] [aria-label="Message actions"]';
MORE_BUTTONS_QUERY = '[aria-label="More"]';

// The button used to open the remove confirmation dialog.
REMOVE_BUTTON_QUERY =
  '[aria-label="Remove message"],[aria-label="Remove Message"]';

// The button used to close the 'message removed' post confirmation.
OKAY_BUTTON_QUERY = '[aria-label="Okay"]';

// The button used to get rid of the Could Not Remove Message popup.
COULDNT_REMOVE_QUERY = "._3quh._30yy._2t_._5ixy.layerCancel";

// The button used to confirm the message removal.
REMOVE_CONFIRMATION_QUERY = '[aria-label="Remove"]';

// The holder for all of the messages in the chat.
SCROLLER_QUERY =
  '[role="main"] .buofh1pr.j83agx80.eg9m0zos.ni8dbmo4.cbu4d94t.gok29vw1';
MESSAGES_QUERY = "[aria-label=Messages]";

// The loading animation.
LOADING_QUERY = '[role="main"] svg[aria-valuetext="Loading..."]';

// The div at the very top of the message chain.
TOP_OF_CHAIN_QUERY =
  ".d2edcug0.hpfvmrgz.qv66sw1b.c1et5uql.gk29lw5a.a8c37x1j.keod5gw0.nxhoafnm.aigsh9s9.d9wwppkn.fe6kdd0r.mau55g9w.c8b282yb.hrzyx87i.o3w64lxj.b2s5l15y.hnhda86s.oo9gr5id.oqcyycmt";

// The div holding the inbox (used for scrolling).
INBOX_QUERY =
  ".q5bimw55.rpm2j7zs.k7i0oixp.gvuykj2m.j83agx80.cbu4d94t.ni8dbmo4.eg9m0zos.l9j0dhe7.du4w35lb.ofs802cu.pohlnb88.dkue75c7.mb9wzai9.d8ncny3e.buofh1pr.g5gj957u.tgvbjcpo.l56l04vs.r57mb794.kh7kg01d.c3g1iek1.k4xni2cv";

// Sticker query.
STICKER_QUERY = "[aria-label$=sticker]";

// The button used to keep scrolling up after a search in the messenger chain.

// The info button.
INFO_QUERY = "[aria-label='Conversation Information']";

// The customize chat button. Requires additional text filtering for "Customize Chat".
CUSTOMIZE_CHAT_QUERY = ".qzhwtbm6.knvmm38d";

// Div holding the search in conversation button. Requires additional text
// filtering for "Search in Conversation".
SEARCH_IN_CONVO_QUERY =
  ".a8c37x1j.ni8dbmo4.stjgntxs.l9j0dhe7.ltmttdrg.g0qnabr5";

// The currently highlighted search terms.
HIGHLIGHTED_QUERY =
  "[data-testid='messenger_incoming_text_row'] [role='gridcell']";

// Queries that were sent by other people, that can be used as possible search
// terms.
SEARCH_CANDIDATE_QUERY = '[data-testid="messenger_incoming_text_row"]';

// The actual search bar.
SEARCH_BAR_QUERY = '[placeholder="Search"]';

// Buttons used for searching up and down searches.
NEXT_SEARCH_QUERY = '[aria-label="Next"]';
PREVIOUS_SEARCH_QUERY = '[aria-label="Previous"]';

(function () {
  STATUS = {
    CONTINUE: "continue",
    ERROR: "error",
    COMPLETE: "complete",
  };

  // Helper functions ----------------------------------------------------------
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getSiblings(el) {
    // Setup siblings array and get the first sibling
    var siblings = [];
    var sibling = el.parentNode.firstChild;

    // Loop through each sibling and push to the array
    while (sibling) {
      if (sibling.nodeType === 1 && sibling !== el) {
        siblings.push(sibling);
      }
      sibling = sibling.nextSibling;
    }

    return siblings;
  }

  // Removal functions ---------------------------------------------------------
  function removeStickerRowsFromDOM() {
    const stickers = document.querySelectorAll(STICKER_QUERY);
    console.log("Removing stickers from dom: ", stickers);
    for (let sticker of stickers) {
      let el = sticker;
      try {
        while (el.getAttribute("role") !== "row") el = el.parentElement;
        el.remove();
      } catch (err) {
        console.log(err);
      }
    }
  }

  async function unsendAllVisibleMessages(lastRun, count) {
    // Start by removing messages that cant be unsent (due to fb being weird).
    removeStickerRowsFromDOM();

    // Click on all ... buttons that let you select 'more' for all messages you
    // sent.
    const more_buttons_holders = document.querySelectorAll(
      MORE_BUTTONS_HOLDER_QUERY
    );
    console.log("Found hidden menu holders: ", more_buttons_holders);
    [...more_buttons_holders].map((el) => {
      el.click();
    });

    let more_buttons = [
      ...document.querySelectorAll(MORE_BUTTONS_QUERY),
    ].filter((el) => {
      return el.getAttribute("data-clickcount") < 5;
    });

    const more_button_count = more_buttons.length;
    console.log("Clicking more buttons: ", more_buttons);

    while (more_buttons.length > 0) {
      console.log("Clicking more buttons: ", more_buttons);
      [...more_buttons].map((el) => {
        el.click();
        const prevClickCount = el.getAttribute("data-clickcount");
        el.setAttribute(
          "data-clickcount",
          prevClickCount ? prevClickCount + 1 : 1
        );
      });
      await sleep(2000);

      // Click on all of the 'remove' popups that appear.
      let remove_buttons = document.querySelectorAll(REMOVE_BUTTON_QUERY);
      while (remove_buttons.length > 0) {
        console.log("Clicking remove buttons: ", remove_buttons);
        [...remove_buttons].map((el) => {
          el.click();
        });

        // Click on all of the 'confirm remove' buttons.
        await sleep(5000);
        let unsend_buttons = document.querySelectorAll(
          REMOVE_CONFIRMATION_QUERY
        );

        while (unsend_buttons.length > 0) {
          console.log("Unsending: ", unsend_buttons);
          for (let unsend_button of unsend_buttons) {
            unsend_button.click();
          }
          await sleep(5000);
          unsend_buttons = document.querySelectorAll(REMOVE_CONFIRMATION_QUERY);
        }

        remove_buttons = document.querySelectorAll(REMOVE_BUTTON_QUERY);
      }
      more_buttons = [...document.querySelectorAll(MORE_BUTTONS_QUERY)].filter(
        (el) => {
          return el.getAttribute("data-clickcount") < 5;
        }
      );
    }

    // If this is the last run before the runner cycle finishes, dont keep
    // scrolling up.
    if (lastRun) {
      return { status: STATUS.CONTINUE, data: 500 };
    }

    // Cleaned out all the couldnt remove buttons. Now, check to see if we need
    // to hit the 'Load More' button or if we need to scroll up.
    const scroller_ = document.querySelector(SCROLLER_QUERY);
    const topOfChain = document.querySelector(TOP_OF_CHAIN_QUERY);
    await sleep(2000);
    if (topOfChain) {
      // We hit the top. Bubble this info back up.
      console.log("Reached top of chain: ", topOfChain);
      return { status: STATUS.COMPLETE };
    } else if (scroller_ && scroller_.scrollTop !== 0) {
      // If we don't have any load more buttons, just try scrolling up.
      console.log("Trying to scroll up.");
      try {
        scroller_.scrollTop = 0;
      } catch (err) {
        console.log(err);
      }

      // Don't continue until the loading animation is gone.
      await sleep(2000);
      let loader = document.querySelector(LOADING_QUERY);
      while (loader) {
        console.log("Waiting for loading messages to populate...", loader);
        await sleep(2000);
        loader = document.querySelector(LOADING_QUERY);
      }
    } else {
      // Something is wrong. We dont have load more OR scrolling, but we havent
      // hit the top either.
      console.log(
        "No scroller or load buttons, but we didnt hit the top. Failing."
      );
      return { status: STATUS.ERROR };
    }

    // And then run the whole thing again after 500ms for loading if we didnt
    // have any removals (to zoom up quickly), or 5s if we did have removals to
    // avoid any rate limiting.
    if (more_button_count === 0) {
      return { status: STATUS.CONTINUE, data: 500 };
    } else {
      return { status: STATUS.CONTINUE, data: 5000 };
    }
  }

  async function runner(count) {
    console.log("Starting runner removal for N iterations: ", count);
    for (let i = 0; i < count || !count; ++i) {
      console.log("Running count:", i);
      const sleepTime = await unsendAllVisibleMessages(i == count - 1, 100);
      if (sleepTime.status === STATUS.CONTINUE) {
        await sleep(sleepTime.data);
      } else if (sleepTime.status === STATUS.COMPLETE) {
        return STATUS.COMPLETE;
      }
    }
    console.log("Completed run.");
    return STATUS.CONTINUE;
  }

  async function ensureSearchBarIsOpen() {
    // Set up some helpers...
    const getCustomizeChat = () => {
      return [...document.querySelectorAll(CUSTOMIZE_CHAT_QUERY)].filter(
        (el) => el.innerText === "Customize Chat"
      );
    };

    const getSearchInConvo = () => {
      return [...document.querySelectorAll(SEARCH_IN_CONVO_QUERY)].filter(
        (el) => el.innerText === "Search in Conversation"
      );
    };

    const getSearchBar = () => {
      return [...document.querySelectorAll(SEARCH_BAR_QUERY)];
    };

    // First check to see if the info button is clicked. If it isn't, click it.
    if (getCustomizeChat().length === 0) {
      document.querySelectorAll(INFO_QUERY)[0].click();
      await sleep(2000);
    }

    // Then check to make sure the customize chat button is clicked.
    if (getSearchInConvo().length === 0) {
      getCustomizeChat()[0].click();
      await sleep(2000);
    }

    // Then enable the search bar.
    if (getSearchBar().length === 0) {
      getSearchInConvo()[0].click();
      await sleep(2000);
    }

    const searchBar = getSearchBar()[0];
    console.log("Got search bar: ", searchBar);
    return searchBar;
  }

  async function enterSearchbar(searchText) {
    // Get the search bar and set the text to search for. Make sure things have
    // actually loaded.
    console.log("Set up search bar. Starting removal process.");
    const searchBar = await ensureSearchBarIsOpen();

    // Either way, need to re-query the search bar because we recreated it.
    searchBar.focus();
    searchBar.value = searchText;

    // Trigger the search.
    console.log("Searching for: ", searchText);
    const ke_down = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      keyCode: 13,
    });
    searchBar.dispatchEvent(ke_down);

    const ke_up = new KeyboardEvent("keyup", {
      bubbles: true,
      cancelable: true,
      keyCode: 13,
    });
    searchBar.dispatchEvent(ke_up);

    // Look for the message that best matches searchText.
    // As a heuristic, we stop at the first message where every highlighted
    // word also appears in the searchText. This has obvious failure modes,
    // but is also probably sufficient for natural language.
    const nextButton = document.querySelectorAll(NEXT_SEARCH_QUERY)[0];
    const expectedMatcherLength = searchText
      .split(/\s+/)
      .filter((word) => word.length > 3).length;
    console.log("Looking for message with N matches: ", expectedMatcherLength);
    for (let i = 0; i < 20; ++i) {
      await sleep(5000);
      const highlighted = document.querySelectorAll(HIGHLIGHTED_QUERY);
      console.log("Highlighted: ", highlighted);
      if (highlighted.length === 0) {
        // Hit a weird case where the search button wasn't actually pressed.
        // Return error.
        console.log("Search text not indexed by facebook. Returning error.");
        return STATUS.ERROR;
      }
      const allInQuery = [...highlighted].map((el) =>
        searchText.includes(el.innerHTML)
      );
      console.log("Query selection: ", allInQuery);
      if (allInQuery.filter(Boolean).length >= expectedMatcherLength) {
        console.log("Got the closest match for search text.");
        return STATUS.CONTINUE;
      }
      console.log("Did not find match for search text, continuing");
      nextButton.click();
    }
    console.log("Could not find any matches for search: ", searchText);
    return STATUS.ERROR;
  }

  async function getNextSearchText(prevSearchText) {
    // Get all the candidate search messages. Cut each one down to a 15 word
    // string. Remove any that are the same as the current searchText or have
    // fewer than 5 words with length greater than 3.
    const candidates = [...document.querySelectorAll(SEARCH_CANDIDATE_QUERY)];
    console.log("Candidates: ", candidates);
    const processedCandidates = candidates
      .map((el) => el.innerText.split(/\s+/).slice(0, 15).join(" "))
      .filter((text) => {
        if (
          text !== prevSearchText &&
          text.split(/\s+/).filter((word) => word.length > 3).length > 5
        ) {
          return true;
        }
        return false;
      });
    console.log("Processed candidates: ", processedCandidates);

    // Next, reset the search bar to bring us back down to the beginning, and
    // then try and find the next best matching search point.
    for (let candidate of processedCandidates) {
      console.log("Testing search candidate: ", candidate);
      if ((await enterSearchbar(candidate)) === STATUS.CONTINUE) {
        console.log("Found match for candidate: ", candidate);
        return { status: STATUS.CONTINUE, data: candidate };
      }
    }

    console.log(
      "No candidate within list of processedCandidates found.",
      processedCandidates
    );
    return STATUS.ERROR;
  }

  async function longChain(count, runnerCount, searchText) {
    searchText = searchText ? searchText : "";
    for (let i = 0; i < count || !count; ++i) {
      console.log("On run: ", i);

      // Get next search text.
      searchText = await getNextSearchText(searchText);

      // const status = await runner(runnerCount);
      // console.log("Runner status: ", status);
      // if (status === STATUS.COMPLETE) return { status: status };
    }

    // return next search text to store for refreshes.
    // return { status: STATUS.CONTINUE };
  }

  // Scroller functions --------------------------------------------------------
  function scrollToBottomHelper() {
    let scroller = document.querySelectorAll(INBOX_QUERY)[0];
    scroller.scrollTop = scroller.scrollHeight;
  }

  async function scrollToBottom(limit) {
    for (let i = 0; i < limit; ++i) {
      scrollToBottomHelper();
      await sleep(2000);
    }
  }

  // Handlers ------------------------------------------------------------------
  const currentURL =
    location.protocol + "//" + location.host + location.pathname;

  async function removeHandler(tabId) {
    const status = await longChain(5, 5);
    if (status.status === STATUS.COMPLETE) {
      console.log(
        "Possibly successfully removed all messages. Running one more confirmation attempt."
      );
      chrome.runtime.sendMessage({
        action: "STORE",
        data: { [currentURL]: { confirmSuccess: true } },
        response: { tabId: tabId, action: "RELOAD" },
      });
    } else if (status.status === STATUS.CONTINUE) {
      console.log("Completed runner iteration but did not finish removal.");
      chrome.runtime.sendMessage({
        action: "STORE",
        data: { [currentURL]: { isRemoving: true } },
        response: { tabId: tabId, action: "RELOAD" },
      });
    } else {
      console.log("Failed to complete longChain removal.");
    }
  }

  chrome.runtime.onMessage.addListener(async function (msg, sender) {
    console.log("Got action: ", msg.action);
    const tabId = msg.tabId;
    if (msg.action === "REMOVE") {
      removeHandler(tabId);
    } else if (msg.action === "CONFIRM_REMOVE") {
      const keep_removing = confirm("Continue removing messages?");
      if (keep_removing) removeHandler(tabId);
    } else if (msg.action === "CONFIRM_SUCCESS") {
      await sleep(10000);
      const maybeSuccess = runner(3);
      if (maybeSuccess.status === STATUS.CONTINUE) {
        chrome.runtime.sendMessage({
          action: "STORE",
          data: { [currentURL]: { isRemoving: true } },
        });
        removeHandler(tabId);
      } else if (maybeSuccess.status === STATUS.COMPLETE) {
        console.log("Successful confirmation! All cleared!");
        chrome.runtime.sendMessage({
          action: "STORE",
          data: { [currentURL]: { lastCleared: new Date().toDateString() } },
        });
      } else {
        console.log("Got error during confirmation attempt. Failing.");
        chrome.runtime.sendMessage({
          action: "STORE",
          data: { [currentURL]: { isRemoving: true } },
          response: { tabId: tabId, action: "RELOAD" },
        });
      }
    } else if (msg.action === "SCROLL") {
      scrollToBottom(100);
    } else if (msg.action === "RELOAD") {
      window.location = window.location.pathname;
    } else {
      console.log("Unknown action.");
    }
  });

  // Check to see if we need to kick off a removal request.
  console.log("Checking existing removal process.");
  chrome.runtime.sendMessage({
    action: "CHECK_ALREADY_REMOVING",
  });
})();
