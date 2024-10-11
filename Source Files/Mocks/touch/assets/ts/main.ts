import {Manifest} from 'manifesto.js'

const container = document.querySelector("#iiif-container");
const manifestUrl = "./manifest.json";

async function loadManifest(url: URL): Manifest | undefined {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const json = await response.json();
  return new Manifest(json)

}


const manifest = await loadManifest(new URL(manifestUrl, window.location.origin))
console.log(manifest)
