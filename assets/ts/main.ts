// @ts-expect-error Resolved through the merged Hugo assets filesystem (theme submodule) at build time
import { addConsent } from './iframe-consent.ts';
// @ts-expect-error Resolved through the merged Hugo assets filesystem (theme submodule) at build time
import { initMap } from './maps/osm-map.ts';
import { checkLinksForQClasses } from './wikidata';

import stickybits from 'stickybits'
window.stickybits = stickybits;

window.addConsent = addConsent;
window.initMap = initMap;
import chroma from 'chroma-js';
window.chroma = chroma;
import WordCloud from 'wordcloud';
window.WordCloud = WordCloud;

/*
document.addEventListener("DOMContentLoaded", function() {
  checkLinksForQClasses();
});
*/

import enterView from 'enter-view';
window.enterView = enterView;

import Elevator from 'elevator.js';

function expandDetails() {
  const hash = window.location.hash;

  if (hash) {
    const id = hash.substring(1);
    const targetElement = document.getElementById(id);

    if (targetElement instanceof HTMLDetailsElement) {
      targetElement.open = true;
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        container: 'content-container'
      } as ScrollIntoViewOptions);
    }
  }
}

function fitTextToContainer(containerSelector: string, widthSelector?: string) {
  const initial = document.querySelector(containerSelector);

  if (!initial) {
    //console.warn(`Container not found: ${containerSelector}`);
    return;
  }
  let container: Element = initial;

  function getTextElements(root: Element): HTMLElement[] {
    const result: HTMLElement[] = [];

    function walk(node: Element) {
      const hasDirectText = Array.from(node.childNodes).some(
        (n) => (n.textContent ?? "").trim() !== ""
      );

      if (hasDirectText) {
        result.push(node as HTMLElement);
      } else {
        for (const child of node.children) {
          walk(child);
        }
      }
    }

    walk(root);
    return result;
  }

  function fitElement(el: HTMLElement, container: Element) {
    const computedStyle = window.getComputedStyle(el);
    const naturalSize = parseFloat(computedStyle.fontSize);
    const minFontSize = parseFloat(computedStyle.getPropertyValue("--min-font-size")) || 8;
    const containerWidth = container.clientWidth;

    const previousWhiteSpace = el.style.whiteSpace;
    const previousDisplay = el.style.display;
    el.style.whiteSpace = "nowrap";
    el.style.display = "inline-block";

    const naturalWidth = el.getBoundingClientRect().width;

    el.style.whiteSpace = previousWhiteSpace;
    el.style.display = previousDisplay;

    if (naturalWidth <= containerWidth) return;

    const fittedSize = Math.max(naturalSize * (containerWidth / naturalWidth), minFontSize);
    el.style.fontSize = `${fittedSize}px`;
  }

  document.fonts.ready.then(() => {
    const textElements = getTextElements(container);
    if (widthSelector != undefined) {
       const widthContainer = document.querySelector(widthSelector);
       if (widthContainer) {
         container = widthContainer;
       }
    }

    if (textElements.length === 0) {
      console.warn(`No text elements found in container: ${containerSelector}`);
      return;
    }

    textElements.forEach((el) => fitElement(el, container));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const backToTop = document.querySelector<HTMLElement>('.backToTop');
  if (backToTop !== null) {
    let elevator: Elevator | null = null;
    const initElevator = () => {
      if (elevator !== null) {
        return;
      }
      elevator = new Elevator({
        mainAudio: '/sounds/elevator.mp3',
        endAudio: '/sounds/ding.mp3',
        element: backToTop,
        duration: 2000
      });
    };
    backToTop.addEventListener('pointerenter', initElevator, { once: true });
    backToTop.addEventListener('pointerdown', initElevator, { once: true });
    backToTop.addEventListener('focus', initElevator, { once: true });
  }

  //fitTextToContainer('.section-head');
  ([['.section-head'], ['.single .post-title', '.content']] as [string, string?][]).forEach(([headSelector, contentSelector]) => {
    fitTextToContainer(headSelector, contentSelector)
  })

  //const details = document.querySelectorAll('.inline-collection', 'details');
  expandDetails()

  const searchButton = document.querySelector("#menu-search-button");
  const searchInput = document.querySelector("#menu-search-input");
  const searchForm = document.querySelector("#menu-search-form");
  if (searchForm instanceof HTMLFormElement && searchInput instanceof HTMLInputElement && searchButton !== null) {
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
