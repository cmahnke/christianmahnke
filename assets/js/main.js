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

function expandDetails() {
  const hash = window.location.hash;

  if (hash) {
    const id = hash.substring(1);
    const targetElement = document.getElementById(id);

    if (targetElement && targetElement.tagName === 'DETAILS') {
      targetElement.open = true;
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        container: 'content-container'
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', (event) => {
  var elevator = new Elevator({
    mainAudio: '/sounds/elevator.mp3',
    endAudio: '/sounds/ding.mp3',
    element: document.querySelector('.backToTop'),
    duration: 2000
  });

  //const details = document.querySelectorAll('.inline-collection', 'details');
  expandDetails()

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

  const contentSelector = ".content-container";
  const postBody = document.querySelector(contentSelector);

  /*
  function scrollProgress() {
    const barSelector = ".progress-bar";
    const barContainerSelector = ".progress-container";
    const bottom = postBody.offset().top + postBody.height();
    let viewportHeight = window.innerHeight;
    let progress = 100 - (((bottom - (viewport.scrollTop() + viewportHeight) + viewportHeight / 3) / (bottom - viewportHeight + viewportHeight / 3)) * 100);
      document.querySelector(barSelector).style.width = progress + '%';
    if (progress > 100) {
      document.querySelector$(barContainerSelector).classList.add('complete')
    } else {
      document.querySelector$(barContainerSelector).classList.remove('complete');
    }
  }

  scrollProgress();
  window.addEventListener('scroll', (event) => {
    scrollProgress();
  });
  window.addEventListener('resize', (event) => {
    scrollProgress();
  });
  window.addEventListener('orientationchange', (event) => {
    scrollProgress();
  });
  */
});
