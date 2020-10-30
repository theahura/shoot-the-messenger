function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function unsendAllVisibleMessages() {
    // Click on all ... buttons that let you select 'more' for all messages you sent.
    let more_buttons = document.querySelectorAll('._3058._ui9._hh7._6ybn._s1-._52mr._43by._6ybp._3oh- ._8sop._2rvp._7i2l');
    console.log(more_buttons);
    for (let more_button of more_buttons) {
      more_button.click();
    }

    // Click on all of the 'remove' popups that appear. There may be other options, like 'Save to Facebook' -- make sure to drop those.
    let remove_buttons = document.getElementsByClassName('_hw5');
    console.log(remove_buttons);
    for (let remove_button of remove_buttons) {
      if (remove_button.innerHTML !== 'Remove') continue;
      remove_button.click()
    }

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
          console.log(couldntremove.click());
          await sleep(2000)
        }
        couldntremoves = document.getElementsByClassName('_3quh _30yy _2t_ _5ixy layerCancel');
    }

    // And try again. If there are no failed attempts at removal, scroll to the top, remove everything else from the DOM to save RAM.
    if (couldntremoves.length === 0) {
        try {
            let scroller_ = document.querySelector('._4u-c._1wfr._9hq [id*=js_]');
            scroller_.scrollTop = 0;
            let removableElementsHolder_ = scroller_.querySelector('[id*=js_1]');
            while (removableElementsHolder_.childNodes.length > 5) {
                removableElementsHolder_.removeChild(removableElementsHolder_.lastChild);
            }
        } catch (err) { console.log(err) }
    }

    // And then run the whole thing again after 500ms for loading. 5 minutes if there's rate limiting.
    if (remove_buttons.length === 0) {
      return 500;
    } else if (couldntremoves.length !== 0) {
      console.log("Got a couldntremove, waiting 5 min to avoid ratelimits.");
      return 300000;
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
    while (true) {
        await sleep(5000);
        const highlighted = document.getElementsByClassName("__in");
        console.log(highlighted)
        const allInQuery = [...highlighted].map(el => searchText.includes(el.innerHTML));
        console.log(allInQuery);
        if (allInQuery.every(v => v === true) && allInQuery.length > 6) break;
        console.log("Did not find match for search text, continuing");
        nextButton.click();
        break;
    }    
}

async function longChain() {
  const searchInConvo = [...document.getElementsByClassName('_3szq')].filter(el => el.innerHTML === "Search in Conversation")[0];
  searchInConvo.click();
  let searchBar = $('*[placeholder="Search in Conversation"]');
  console.log("Set up search bar. Starting removal process.");
  let searchText = "";

  while(true) {
     await runner(10);
     const candidateSearchTexts = document.getElementsByClassName('_3oh- _58nk');
     for (let el of candidateSearchTexts) {
         if (el.innerHTML.split(' ').length < 10) continue;
         searchText = el.innerHTML;
     }
     enterSearchbar(searchText);
  }
}

function scrollToBottom(counter, limit) {
  let scroller = document.querySelectorAll('._5f0v .uiScrollableAreaWrap.scrollable')[0];
  scroller.scrollTop = scroller.scrollHeight;
  if (counter >= limit) return;
  setTimeout(() => scrollToBottom(++counter, limit), 500);
}
