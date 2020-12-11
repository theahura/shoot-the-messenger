(function() {
  STATUS = {
    CONTINUE: "continue",
    ERROR: "error",
    COMPLETE: "complete"
  };

  // Helper functions ----------------------------------------------------------
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Removal functions ---------------------------------------------------------
  async function unsendAllVisibleMessages(lastRun) {
    // Click on all ... buttons that let you select 'more' for all messages you
    // sent.
    let more_buttons = document.querySelectorAll(
      '.clearfix._o46._3erg._3i_m._nd_.direction_ltr.text_align_ltr div:not([data-tooltip-content*="Unsent"]) [aria-label="More"]'
    );
    console.log("Clicking more buttons: ", more_buttons);
    for (let more_button of more_buttons) {
      more_button.click();
    }

    // Click on all of the 'remove' popups that appear. There may be other
    // options, like 'Save to Facebook' -- make sure to drop those.
    let remove_buttons = document.getElementsByClassName("_hw5");
    console.log("Clicking remove buttons: ", remove_buttons);
    for (let remove_button of remove_buttons) {
      if (remove_button.textContent !== "Remove") continue;
      remove_button.click();
    }
    await sleep(2000);

    // Each one of those remove buttons will pull up a modal for confirmation.
    // Click all of those modals too. If a minute has passed and we're still
    // pushing modals, keep going; something probably got stuck.
    let unsend_buttons = document.getElementsByClassName(
      "_3quh _30yy _2t_ _3ay_ _5ixy"
    );
    for (let i = 0; unsend_buttons.length > 0 || i < 10; ++i) {
      console.log("Clicking unsend buttons: ", unsend_buttons);
      for (let unsend_button of unsend_buttons) {
        unsend_button.click();
        await sleep(5000);
      }
      unsend_buttons = document.getElementsByClassName(
        "_3quh _30yy _2t_ _3ay_ _5ixy"
      );
    }

    // Sometimes a remove fails for inexplicable reasons, likely rate limting.
    // Loop until those are gone.
    let couldntremoves = document.getElementsByClassName(
      "_3quh _30yy _2t_ _5ixy layerCancel"
    );
    while (couldntremoves.length > 0) {
      console.log("Got couldnt remove dialogs: ", couldntremoves);
      console.log("Waiting 5 minutes.");

      // If we got couldn't removes, its because of rate limiting. Wait 5
      // minutes before starting up again to see if that clears the issue.
      await sleep(300000);

      for (let couldntremove of couldntremoves) {
        couldntremove.click();
        await sleep(200);
      }
      couldntremoves = document.getElementsByClassName(
        "_3quh _30yy _2t_ _5ixy layerCancel"
      );
    }

    // If this is the last run before the runner cycle finishes, dont keep
    // scrolling up.
    if (lastRun) {
      return { status: STATUS.CONTINUE, data: 500 };
    }

    // Cleaned out all the couldnt remove buttons. Now, check to see if we need
    // to hit the 'Load More' button or if we just need to scroll up.
    const maybeLoaders = document.getElementsByClassName(
      "_3quh _30yy _2t_ _41jf"
    );
    const scroller_ = document.querySelector("._4u-c._1wfr._9hq [id*=js_]");
    if (maybeLoaders.length > 1) {
      // We should have two load more buttons, unless we've hit the top.
      console.log("Clicking load more.");
      maybeLoaders[0].click();
      await sleep(2000);
    } else if (scroller_ && scroller_.scrollTop !== 0) {
      // If we don't have any load more buttons, just try scrolling up.
      console.log("Trying to scroll up.");
      try {
        scroller_.scrollTop = 0;
      } catch (err) {
        console.log(err);
      }
    } else {
      // There's no Load More button and there's no more scrolling up, so we
      // probably sucessfully finished. Bubble this info back up.
      console.log("Reached top of chain.");
      return { status: STATUS.COMPLETE };
    }

    // And then run the whole thing again after 500ms for loading if we didnt
    // have any removals (to zoom up quickly), or 5s if we did have removals to
    // avoid any rate limiting.
    if (remove_buttons.length === 0) {
      return { status: STATUS.CONTINUE, data: 500 };
    } else {
      return { status: STATUS.CONTINUE, data: 5000 };
    }
  }

  async function runner(count) {
    console.log("Starting runner removal for N iterations: ", count);
    for (let i = 0; i < count || !count; ++i) {
      console.log("Running count:", i);
      const sleepTime = await unsendAllVisibleMessages(i == count - 1);
      if (sleepTime.status === STATUS.CONTINUE) {
        await sleep(sleepTime.data);
      } else if (sleepTime.status === STATUS.COMPLETE) {
        return STATUS.COMPLETE;
      }
    }
    console.log("Completed run.");
    return STATUS.CONTINUE;
  }

  async function enterSearchbar(searchText) {
    // Get the search bar and set the text to search for. Make sure things have
    // actually loaded.
    console.log("Set up search bar. Starting removal process.");
    let searchInConvo = null;
    for (let i = 0; !searchInConvo || i < 10; ++i) {
      searchInConvo = [...document.getElementsByClassName("_3szq")].filter(
        el => el.innerHTML === "Search in Conversation"
      )[0];

      if (!searchInConvo) await sleep(5000);
    }

    if (!searchInConvo) {
      console.log(
        "Could not find Search In Conversation button after 50 seconds."
      );
      return STATUS.ERROR;
    }

    console.log("Got searchInConvo: ", searchInConvo);

    let searchBar = document.querySelector(
      '*[placeholder="Search in Conversation"]'
    );
    let previousSearch = document.querySelector("._33p7[role=presentation]");

    if (searchBar || previousSearch) {
      // Need to reboot the search bar.
      console.log(
        "Resetting search bar. Previous searchbar found: ",
        searchBar,
        previousSearch
      );
      searchInConvo.click();
      await sleep(2000);
      searchInConvo.click();
      await sleep(2000);
    } else {
      // Need to open the search bar.
      console.log("Opening search bar. No searchbar found: ", searchBar);
      searchInConvo.click();
      await sleep(2000);
    }

    // Either way, need to re-query the search bar because we recreated it.
    searchBar = document.querySelector(
      '*[placeholder="Search in Conversation"]'
    );
    searchBar.focus();
    searchBar.value = searchText;

    // Trigger the search.
    console.log("Searching for: ", searchText);
    const ke_down = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      keyCode: 13
    });
    searchBar.dispatchEvent(ke_down);

    const ke_up = new KeyboardEvent("keyup", {
      bubbles: true,
      cancelable: true,
      keyCode: 13
    });
    document.body.dispatchEvent(ke_up);

    // Look for the message that best matches searchText.
    // As a heuristic, we stop at the first message where every highlighted
    // word also appears in the searchText. This has obvious failure modes,
    // but is also probably sufficient for natural language.
    const nextButton = document.getElementsByClassName(
      "_3quh _30yy _2t_ _-19 _b-u"
    )[0];
    const expectedMatcherLength = searchText
      .split(/\s+/)
      .filter(word => word.length > 3).length;
    console.log("Looking for message with N matches: ", expectedMatcherLength);
    for (let i = 0; i < 20; ++i) {
      await sleep(5000);
      const highlighted = document.getElementsByClassName("__in");
      console.log("Highlighted: ", highlighted);
      if (highlighted.length === 0) {
        // Hit a weird case where the search button wasn't actually pressed.
        // Return error.
        console.log("Search text not indexed by facebook. Returning error.");
        return STATUS.ERROR;
      }
      const allInQuery = [...highlighted].map(el =>
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

  async function getNextSearchText(searchText) {
    // Get all the candidate search messages. Cut each one down to a 15 word
    // string. Remove any that are the same as the current searchText or have
    // fewer than 5 words with length greater than 3.
    const candidates = [...document.getElementsByClassName("_3oh- _58nk")];
    console.log("Candidates: ", candidates);
    const processedCandidates = candidates
      .map(el =>
        el.innerText
          .split(/\s+/)
          .slice(0, 15)
          .join(" ")
      )
      .filter(text => {
        if (
          text !== searchText &&
          text.split(/\s+/).filter(word => word.length > 3).length > 5
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

  async function longChain(count, runnerCount, prevSearchText) {
    let searchText = "";

    if (prevSearchText) {
      console.log("Got search text: ", prevSearchText);
      const prevSearchStatus = await enterSearchbar(prevSearchText);
      if (prevSearchStatus === STATUS.CONTINUE) {
        console.log("Successfully reloaded old state. Starting runner.");
        searchText = prevSearchText;
      }
    }

    const actualRunnerCount = runnerCount ? runnerCount : 10;
    for (let i = 0; i < count || !count; ++i) {
      console.log("On run: ", i);
      const status = await runner(actualRunnerCount);
      console.log("Runner status: ", status);
      if (status === STATUS.COMPLETE) return { status: status };

      const maybeSearchText = await getNextSearchText(searchText);
      if (maybeSearchText.status === STATUS.CONTINUE) {
        console.log("Next search is: ", maybeSearchText.data);
        searchText = maybeSearchText.data;
      } else {
        console.log(
          "Encountered error. All messages may not have been deleted."
        );

        // Check one last time to make sure this was in fact an error and not a
        // reason to clear.
        console.log("Testing error status.");
        const maybeStatus = await runner(actualRunnerCount);
        if (maybeStatus === STATUS.COMPLETE) return { status: maybeStatus };
        console.log("Confirmed error.");

        return { status: STATUS.ERROR };
      }
    }
    return { status: STATUS.CONTINUE, data: searchText };
  }

  // Scroller functions --------------------------------------------------------
  function scrollToBottomHelper() {
    let scroller = document.querySelectorAll(
      "._5f0v .uiScrollableAreaWrap.scrollable"
    )[0];
    scroller.scrollTop = scroller.scrollHeight;
  }

  async function scrollToBottom(limit) {
    for (let i = 0; i < limit; ++i) {
      scrollToBottomHelper();
      await sleep(2000);
    }
  }

  const currentURL =
    location.protocol + "//" + location.host + location.pathname;

  async function removeHandler(msg, tabId) {
    const prevSearchText = msg.prevSearchText
      ? msg.prevSearchText["nextSearchText"]
      : null;
    const maybeSearchText = await longChain(10, 10, prevSearchText);
    if (maybeSearchText.status === STATUS.COMPLETE) {
      console.log(
        "Possibly successfully removed all messages. Running one more confirmation attempt."
      );
      const confirmSuccess = await longChain(5, 5, prevSearchText);
      if (confirmSuccess.status === STATUS.CONTINUE) {
        console.log("Didnt actually complete. Continuing...");
        msg["prevSearchText"] = confirmSuccess.data;
        removeHandler(msg, tabId);
      } else if (confirmSuccess.status === STATUS.ERROR) {
        console.log("Failed to complete longChain removal.");
      } else {
        console.log("Successful confirmation! All cleared!");
        chrome.runtime.sendMessage({
          action: "TEMP_DELETE",
          data: currentURL,
          response: { tabId: tabId, action: "MARK" }
        });
      }
    } else if (maybeSearchText.status === STATUS.CONTINUE) {
      console.log("Completed runner iteration but did not finish removal.");
      chrome.runtime.sendMessage({
        action: "STORE",
        data: { [currentURL]: { nextSearchText: maybeSearchText.data } }
      });
      chrome.runtime.sendMessage({
        action: "TEMP_STORE",
        data: { [tabId]: { nextSearchText: maybeSearchText.data } },
        response: { tabId: tabId, action: "RELOAD" }
      });
    } else {
      console.log("Failed to complete longChain removal.");
    }
  }

  chrome.runtime.onMessage.addListener(async function(msg, sender) {
    console.log("Got action: ", msg.action);
    const tabId = msg.tabId;
    if (msg.action === "REMOVE") {
      removeHandler(msg, tabId);
    } else if (msg.action === "CONFIRM_REMOVE") {
      const keep_removing = confirm(
        "Continue removing messages from: " +
          msg.prevSearchText["nextSearchText"]
      );
      if (keep_removing) removeHandler(msg, tabId);
    } else if (msg.action === "SCROLL") {
      scrollToBottom(100);
    } else if (msg.action === "RELOAD") {
      window.location = window.location.pathname;
    } else if (msg.action === "MARK") {
      chrome.runtime.sendMessage({
        action: "STORE",
        data: { [currentURL]: { lastCleared: new Date().toDateString() } }
      });
    } else {
      console.log("Unknown action.");
    }
  });

  // Check to see if we need to kick off a removal request.
  console.log("Checking existing removal process.");
  chrome.runtime.sendMessage({
    action: "CHECK_ALREADY_REMOVING"
  });
})();
