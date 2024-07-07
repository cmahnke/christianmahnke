import {checkHDR, checkHDRCanvas, Uint16Image} from 'hdr-canvas';

const colorSpace = 'rec2100-hlg';


function loadImage(url) {
  const img = new Image();
  img.src = url;
  img.onload = () => {
    const offscreen = new OffscreenCanvas(img.width, img.height);
    const loadCtx = offscreen.getContext("2d");
    loadCtx.drawImage(img, 0, 0);
    //return loadCtx.getImageData(0, 0, image.width, image.height);
    return loadCtx
  }
}

function hdrCanvasImage (image) {

    var hdrCanvas = document.createElement('canvas')
    hdrCanvas.configureHighDynamicRange({mode:'extended'});
    hdrCanvas.width = image.width;
    hdrCanvas.height = image.height;

    const rec210hglImage = Uint16Image.fromImageData(imData);

    console.log(rec210hglImage)

/*
    rec210hglImage.pixelCallback((r, g, b, a) => {
      return Uint16Array.from([r -1000, g+2000, b+1000, a]);
    });
*/

    const ctx = initHDRCanvas(hdrCanvas);
    ctx.putImageData(rec210hglImage.getImageData(), 0, 0);


  //}
}

function setupCanvas(canvas) {
  canvas.configureHighDynamicRange({mode:'extended'});
  /* See https://github.com/Fyrd/caniuse/issues/6504#issuecomment-1426886762 */
  const ctx = canvas.getContext("2d", {colorSpace: colorSpace, pixelFormat:'float16'});
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

let sliders = {};
['red', 'green', 'blue'].forEach((channel) => {
  sliders[channel] = document.getElementById(`${channel}Slider`);
  sliders[channel].oninput = function() {
    var label = document.querySelector(`label[for=${this.id}] span`);
    label.innerText = this.value;
  }
});

function initCanvas(canvas, imageUrl) {
  const oCanvas = loadImage(imageUrl);
  setupCanvas(canvas);
  canvas.width = oCanvas.width;
  canvas.height = oCanvas.height;

  const img = new Image(); // Create new img element
  img.src = "./public/images/white-hdr.jpeg";
  var canvasArray;

  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    //{colorSpace: colorSpace, pixelFormat:'float32'}
    canvasArray = ctx.getImageData(0, 0, 33, 33);
    console.log(canvasArray);
  };

}

const imageUrl = '/images/sample.jpeg';
const canvas = document.querySelector('#renderer');

initCanvas(canvas, imageUrl);
