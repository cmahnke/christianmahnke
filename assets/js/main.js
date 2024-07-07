window.$ = window.jQuery = require('jquery');
import { addConsent } from './iframe-consent';
import { initMap } from './maps/osm-map.js';
import {checkHDR, checkHDRCanvas} from 'hdr-canvas';

/* See https://github.com/rgalus/sticky-js */
/* window.Sticky = require('sticky-js'); */
import stickybits from 'stickybits'
window.stickybits = stickybits;

window.addConsent = addConsent;
window.initMap = initMap;
window.checkHDR = checkHDR;
window.checkHDRCanvas = checkHDRCanvas;

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
