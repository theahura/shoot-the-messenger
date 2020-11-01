function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function unsendAllVisibleMessages() {
    // Click on all ... buttons that let you select 'more' for all messages you sent.
    let more_buttons = document.querySelectorAll('div:not([data-tooltip-content*="Unsent"])[data-tooltip-position="right"] [aria-label="More"]');
    console.log(more_buttons);
    for (let more_button of more_buttons) {
      more_button.click();
    }

    // Click on all of the 'remove' popups that appear. There may be other options, like 'Save to Facebook' -- make sure to drop those.
    let remove_buttons = document.getElementsByClassName('_hw5');
    console.log(remove_buttons);
    for (let remove_button of remove_buttons) {
      if (remove_button.textContent !== 'Remove') continue;
      remove_button.click()
    }
    await sleep(2000);

    // Each one of those remove buttons will pull up a modal for confirmation. Click all of those modals too. 
    let unsend_buttons = document.getElementsByClassName('_3quh _30yy _2t_ _3ay_ _5ixy');
    while(unsend_buttons.length > 0) {
        console.log(unsend_buttons);
        for (let unsend_button of unsend_buttons) {
          unsend_button.click();
          await sleep(5000)
        }
        unsend_buttons = document.getElementsByClassName('_3quh _30yy _2t_ _3ay_ _5ixy');
    }

    // Sometimes a remove fails for inexplicable reasons. Remove those...
    let couldntremoves = document.getElementsByClassName('_3quh _30yy _2t_ _5ixy layerCancel');
    while (couldntremoves.length > 0) {
        for (let couldntremove of couldntremoves) {
          couldntremove.click();
          await sleep(200)
        }
        couldntremoves = document.getElementsByClassName('_3quh _30yy _2t_ _5ixy layerCancel');
    }

    // And try again. If there are no failed attempts at removal, scroll to the top, remove everything else from the DOM to save RAM.
    if (couldntremoves.length === 0) {
        // Check to see if we need to hit the 'Load More' button.
        const maybeLoaders = document.getElementsByClassName('_3quh _30yy _2t_ _41jf');
        if (maybeLoaders.length > 0) {
          maybeLoaders[0].click();
          await sleep(2000);
        } else {
            try {
                let scroller_ = document.querySelector('._4u-c._1wfr._9hq [id*=js_]');
                scroller_.scrollTop = 0;
                let removableElementsHolder_ = document.querySelector('[aria-label=Messages').querySelector('[id*=js_1]');
                while (removableElementsHolder_.childNodes.length > 5) {
                    removableElementsHolder_.removeChild(removableElementsHolder_.lastChild);
                }
            } catch (err) { console.log(err) }
        }
    }

    // And then run the whole thing again after 500ms for loading. 5 minutes if there's rate limiting.
    if (remove_buttons.length === 0) {
      return 500;
    } else {
      return 5000;
    } 
}

async function runner(count) {
    for (let i = 0; i < count || !count; ++i) {
        console.log("Running count:", i);
        const sleepTime = await unsendAllVisibleMessages();
        await sleep(sleepTime);
    }
    console.log("Completed");
}

async function enterSearchbar(searchText) {
    // Get the search bar and set the text to search for.
    let searchBar = document.querySelector('*[placeholder="Search in Conversation"]');
    searchBar.focus();
    searchBar.value = searchText;
    
    // Trigger the search.
    const ke_down = new KeyboardEvent("keydown", {
        bubbles: true, cancelable: true, keyCode: 13
    });
    searchBar.dispatchEvent(ke_down);

    const ke_up = new KeyboardEvent("keyup", {
        bubbles: true, cancelable: true, keyCode: 13
    });
    document.body.dispatchEvent(ke_up);

    // Look for the message that best matches searchText.
    // As a heuristic, we stop at the first message where every highlighted
    // word also appears in the searchText. This has obvious failure modes,
    // but is also probably sufficient for natural language.
    const nextButton = document.getElementsByClassName('_3quh _30yy _2t_ _-19 _b-u')[0];
    const expectedMatcherLength = searchText.split(' ').filter(word => word.length > 3).length
    while (true) {
        await sleep(5000);
        const highlighted = document.getElementsByClassName("__in");
        console.log(highlighted)
        const allInQuery = [...highlighted].map(el => searchText.includes(el.innerHTML));
        console.log(allInQuery);
        if (allInQuery.every(v => v === true) && allInQuery.length >= expectedMatcherLength) break;
        console.log("Did not find match for search text, continuing");
        nextButton.click();
        break;
    }    
    console.log("Got the closest match for search text.");
}

async function longChain(count, runnerCount) {
  const searchInConvo = [...document.getElementsByClassName('_3szq')].filter(el => el.innerHTML === "Search in Conversation")[0];
   searchInConvo.click();
  await sleep(2000);
  console.log("Set up search bar. Starting removal process.");
  let searchText = "";
  const actualRunnerCount = runnerCount ? runnerCount : 10;
  
  for (let i = 0; i < count || !count; ++i) {
     console.log("On run: ", i);
     await runner(actualRunnerCount);
     const candidateSearchTexts = document.getElementsByClassName('_3oh- _58nk');
     for (let j = 5; j > 0; ++j) {
         console.log("Looking for messages with size: ", j);
         let newSearchText = searchText;
         for (let el of candidateSearchTexts) {
             console.log("Checking candidate: ", el.textContent);
             if (el.textContent === searchText) continue;
             if (el.textContent.split(' ').filter(word => word.length > 3).length < j) continue;
             newSearchText = el.textContent;
             break;
         }
         if (newSearchText !== searchText) {
           searchText = newSearchText;
           break;
         }
     }

     console.log("Resetting search bar.");
     searchInConvo.click();
     searchInConvo.click();
     await sleep(4000);
     console.log("Searching for: ", searchText);
     await enterSearchbar(searchText);
  }
}

function scrollToBottom(counter, limit) {
  let scroller = document.querySelectorAll('._5f0v .uiScrollableAreaWrap.scrollable')[0];
  scroller.scrollTop = scroller.scrollHeight;
  if (counter >= limit) return;
  setTimeout(() => scrollToBottom(++counter, limit), 500);
}
