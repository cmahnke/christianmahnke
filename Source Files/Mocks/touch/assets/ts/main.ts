import { Manifest } from "manifesto.js";
import {World, Runtime, CanvasRenderer, BrowserEventManager, popmotionController} from "@atlas-viewer/atlas";
//import {popmotionController} from "@atlas-viewer/atlas";

const container = document.querySelector("#iiif-container");
const manifestUrl = "./manifest-enriched.json";

async function loadManifest(url: URL): Manifest | undefined {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const json = await response.json();
  return new Manifest(json);
}

function setupContainer(container) {
  const canvas = document.createElement('canvas');

  canvas.style.background = '#000';
  canvas.height = 600;
  canvas.width = 800;

  container.appendChild(canvas);
  const renderer = new CanvasRenderer(canvas);
  return renderer
}

let manifest;
try {
  manifest = await loadManifest(new URL(manifestUrl, window.location.origin));
} catch {
  console.warn(`Manifest ${manifestUrl} not found, make sure to run setup.sh first!`);
}
console.log(manifest);


const renderer = setupContainer(container)
const viewport = { width: 800, height: 600, x: 0, y: 0, scale: 1 };

const world = new World();


const controller = popmotionController({
  minZoomFactor: 0.5,
  maxZoomFactor: 3,
  enableClickToZoom: false,
});

const runtime = new Runtime(renderer, world, viewport, [controller]);
new BrowserEventManager(container, runtime);
