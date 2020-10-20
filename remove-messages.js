function unsendAllVisibleMessages(scrollId) {
    let more_buttons = document.querySelectorAll('._3058._ui9._hh7._6ybn._s1-._52mr._43by._6ybp._3oh- ._8sop._2rvp._7i2l');

    console.log(more_buttons);
    for (let more_button of more_buttons) {
      more_button.click();
    }

    let remove_buttons = document.getElementsByClassName('_hw5');
    console.log(remove_buttons);
    for (let remove_button of remove_buttons) {
      remove_button.click()
    }

    let unsend_buttons = document.getElementsByClassName('_3quh _30yy _2t_ _3ay_ _5ixy');
    while(unsend_buttons.length > 0) {
        console.log(unsend_buttons);
        for (let unsend_button of unsend_buttons) {
          unsend_button.click();
        }
        unsend_buttons = document.getElementsByClassName('_3quh _30yy _2t_ _3ay_ _5ixy');
    }

    const scroller = document.getElementById(scrollId);
    scroller.scrollTop = 0;
    while (scroller.childNodes.length > 2) {
        scroller.removeChild(scroller.lastChild);
    }

    setTimeout(() => unsendAllVisibleMessages(scrollId), 10000);
}
