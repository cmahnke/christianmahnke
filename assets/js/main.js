window.$ = window.jQuery = require('jquery');
import { addConsent } from './iframe-consent';

/* See https://github.com/rgalus/sticky-js */
window.Sticky = require('sticky-js');
window.addConsent = addConsent;

window.enterView = require('enter-view');

import Elevator from 'elevator.js';

window.onload = function() {
  var elevator = new Elevator({
    mainAudio: '/sounds/elevator.mp3',
    endAudio: '/sounds/ding.mp3',
    element: document.querySelector('.backToTop'),
    duration: 2000
  });
}
