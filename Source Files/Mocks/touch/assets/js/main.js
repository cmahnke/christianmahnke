import touchViewer from "./openseadragon-annotorious3";
import "@annotorious/openseadragon/annotorious-openseadragon.css";

import { initTouch } from "./image-touch.js";

const image = document.querySelector("#touch-target");
const status = document.querySelector("#status");
const heightMapUrl = "/page031-1.json";

initTouch(image, heightMapUrl);

const containerId = "iiif-container";
const container = document.querySelector(`#${containerId}`);
const manifestUrl = "./manifest-enriched.json";

touchViewer(containerId, new URL(manifestUrl, window.location.origin));
