(() => {
  const params = JSON.parse(document.currentScript.dataset.params);
  console.log('Got injected parameters: ', params);

  const searchBar = document.querySelectorAll(params.searchBarQuery)[0];
  console.log('Got search bar', searchBar);

  const grandParent = searchBar.parentElement.parentElement;
  const property = Object.getOwnPropertyNames(grandParent).find((p) =>
    p.startsWith('__reactProps'),
  );
  console.log('Got reactprops: ', property);
  console.log('Got grandparent: ', grandParent[property]);
  grandParent[property].children[0].props.commandConfigs[0].handler();
})();
