import { initTouch } from "./image-touch.js";

const image = document.querySelector("#touch-target");
const status = document.querySelector("#status");
const heightMapUrl = "/page031-1.json";

//console.log(`Loaded metadata for touch map width: ${map.width}, height: ${map.height}, scale: ${initialScale}`, map);
initTouch(image, heightMapUrl);
//image.addEventListener("mousemove", await generateHandler(heightMapUrl));
