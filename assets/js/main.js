window.$ = window.jQuery = require('jquery');
import { addConsent } from './iframe-consent';

/* See https://github.com/rgalus/sticky-js */
window.Sticky = require('sticky-js');
window.addConsent = addConsent;

window.enterView = require('enter-view');
/*
TODO: Check if this is still neded to fix Firefox

$(.footer-icon).css({'bottom': '0.2em'});
*/
