function unsendAllVisibleMessages() {
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
        }
        unsend_buttons = document.getElementsByClassName('_3quh _30yy _2t_ _3ay_ _5ixy');
    }

    // Sometimes a remove fails for inexplicable reasons. Remove those...
    const couldntremoves = document.getElementsByClassName('_3quh _30yy _2t_ _5ixy layerCancel');
    for (let couldntremove of couldntremoves) {
      couldntremove.click();
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

    // And then run the whole thing again after 5 seconds for loading.
    setTimeout(unsendAllVisibleMessages, 5000);
}

// Helper function to scroll to the bottom of the messenger chain.
function scrollToBottom(counter, limit) {
  let scroller = document.querySelectorAll('._5f0v .uiScrollableAreaWrap.scrollable')[0];
  scroller.scrollTop = scroller.scrollHeight;
  if (counter >= limit) return;
  setTimeout(() => scrollToBottom(++counter, limit), 500);
}
