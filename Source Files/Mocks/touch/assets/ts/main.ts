import { Manifest } from "manifesto.js";
import createViewer from "./openseadragon.ts";
import { loadManifest } from "./loader.ts";

const containerId = "iiif-container";
const container = document.querySelector(`#${containerId}`);
const manifestUrl = "./manifest-enriched.json";

createViewer(containerId, new URL(manifestUrl, window.location.origin));
