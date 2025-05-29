import { PagefindUI } from "@pagefind/default-ui/npm_dist/mjs/ui-core.mjs";

window.PagefindUI = PagefindUI;



//export function setupSearch(elem, lang) {
//  new PagefindUI({ element: "#search", showSubResults: true });
//}

window.addEventListener('DOMContentLoaded', (event) => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');

  if (query !== null) {
    document.querySelector('.search-input').value = query;
  }

  document.querySelector('.search-button').addEventListener("click", (event) => {

  })

  new PagefindUI({ element: "#search", showSubResults: true });
})
