//window.$ = window.jQuery = require('jquery');
import { addConsent } from './iframe-consent';
import { initMap } from './maps/osm-map.js';
import { checkLinksForQClasses } from './wikidata';

import stickybits from 'stickybits'
window.stickybits = stickybits;

window.addConsent = addConsent;
window.initMap = initMap;
window.chroma = require('chroma-js');
window.WordCloud = require('wordcloud');

/*
document.addEventListener("DOMContentLoaded", function() {
  checkLinksForQClasses();
});
*/

window.enterView = require('enter-view');

import Elevator from 'elevator.js';

window.addEventListener('DOMContentLoaded', (event) => {
  var elevator = new Elevator({
    mainAudio: '/sounds/elevator.mp3',
    endAudio: '/sounds/ding.mp3',
    element: document.querySelector('.backToTop'),
    duration: 2000
  });

  const searchButton = document.querySelector("#menu-search-button");
  const searchInput = document.querySelector("#menu-search-input");
  const searchForm = document.querySelector("#menu-search-form");
  if (searchForm !== null) {
    let focused = false;
    searchInput.addEventListener("focus", () => {
      focused = true;
    })
    searchButton.addEventListener("click", (event) => {
      console.log("got click")
      if (searchInput.value != "") {
        searchForm.submit();

      } else if (searchInput.value == "" && !focused) {
        searchInput.focus();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    })
  }
});
