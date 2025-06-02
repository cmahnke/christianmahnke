import { Instance, Input, ResultList, FilterPills } from "@pagefind/modular-ui";


//export function setupSearch(elem, lang) {
//  new PagefindUI({ element: "#search", showSubResults: true });
//}

window.addEventListener('DOMContentLoaded', (event) => {
  const bundlePath = "/index/"
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  const searchInputSelector = "#search-box";
  const filterContainer = document.querySelector("#search-filter");
  let filterInitialized = false

  if (query !== null) {
    document.querySelector(searchInputSelector).value = query;
  }

  document.querySelector(searchInputSelector).addEventListener("input", (event) => {
    const newQuery = event.target.value
    urlParams.set("q", newQuery);
    history.replaceState(null, null, "?"+urlParams.toString());
  })

  document.querySelector('.search-button').addEventListener("click", (event) => {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      which: 13,
      keyCode: 13,
    });
    document.querySelector(searchInputSelector).dispatchEvent(enterEvent);
  })



  const instance = new Instance({
      bundlePath: bundlePath
  });
  instance.add(new Input({
      inputElement: searchInputSelector
  }));
  instance.on("filters", (filters) => {
    if (!filterInitialized) {
      for (const [filter, values] of Object.entries(filters.available)) {
        /*
        const filterContainer = document.createElement("ul");
        for (const [value, count] of Object.entries(values)) {
          //console.log(`${value}: ${count}`);
          const tag = document.createElement("li");
          tag.innerText = `${value} (${count})`
          filterContainer.appendChild(tag);
        }
        */
        const filterElementId = `search-filter-${filter}`
        const filterElement = document.createElement("div");
        filterElement.id = filterElementId
        filterContainer.appendChild(filterElement)
        instance.add(new FilterPills({
          containerElement: `#${filterElementId}`,
          filter: filter,
          selectMultiple: true,
          alwaysShow: false
        }));
      }
      filterInitialized = true
    }
  });


  /*

  //instance

  */

  instance.add(new ResultList({
      containerElement: "#search-results"
  }));

  instance.triggerLoad();
  document.querySelector(searchInputSelector).focus();

})
