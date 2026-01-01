import { initCanvas } from "./../ts/image-slider";

const imageUrl = "/images/sample.jpeg";
const canvas = document.querySelector("#renderer");

initCanvas(canvas, imageUrl);
