import {checkHDRCanvas, Uint16Image} from 'hdr-canvas';

const colorSpace = 'rec2100-hlg';
const colors = {'red': 0, 'green': 0, 'blue': 0};
let rec210hglImage, hdrCtx

function loadSDRImage(url) {
  return fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      return createImageBitmap(blob)
      })
    .then((bitmap) => {
      const { width, height } = bitmap;
      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      return ctx.getImageData(0, 0, width, height)
    });
}

function setupCanvas(canvas, width, height) {
  if (width !== undefined && width != 0) {
    canvas.width = width;
  }
  if (height !== undefined && height != 0) {
    canvas.height = height;
  }

  let ctx;
  if (checkHDRCanvas()) {
    canvas.configureHighDynamicRange({mode:'extended'});
    /* See https://github.com/Fyrd/caniuse/issues/6504#issuecomment-1426886762 */
    ctx = canvas.getContext("2d", {colorSpace: colorSpace, pixelFormat:'float16'});
    ctx.imageSmoothingEnabled = false;
  } else {
    console.log("Canvas ist't HDR enabled");
    ctx = canvas.getContext("2d");
  }
  return ctx;
}

export function initCanvas(canvas, imageUrl) {
  if (!checkHDRCanvas()) {
    loadSDRImage(imageUrl)
    .then((imageData) => {
      ctx = setupCanvas(canvas, imageData.width, imageData.height);
      ctx.putImageData(imageData, 0, 0);
      ctx.font = "bold 36px sans-serif";
      ctx.fillStyle = "#ff0000";
      ctx.fillText("HDR not supported!", 90, 100);
      ctx.fillText("Image manipulation disabled", 10, 150);
    });
    return;
  }
  loadSDRImage(imageUrl)
  .then((imageData) => {
    hdrCtx = setupCanvas(canvas, imageData.width, imageData.height);
    rec210hglImage = Uint16Image.fromImageData(imageData);
    hdrCtx.putImageData(rec210hglImage.getImageData(), 0, 0);
  });

  let sliders = {};
  ['red', 'green', 'blue'].forEach((channel) => {
    sliders[channel] = document.getElementById(`${channel}Slider`);
    document.querySelector(`label[for=${sliders[channel].id}] span`).innerText = sliders[channel].value + '%';
    colors[channel] = sliders[channel].value;
    sliders[channel].oninput = function() {
      var label = document.querySelector(`label[for=${this.id}] span`);
      label.innerText = this.value + '%';
      colors[channel] = this.value;
      const changedImage = rec210hglImage.clone();
      changedImage.pixelCallback((r, g, b, a) => {
        var nr = (r / 50) * colors['red'];
        var ng = (g / 50) * colors['green'];
        var nb = (b / 50) * colors['blue'];
        const pixel = Uint16Array.from([nr, ng, nb, a]);
        return pixel;
      });
      hdrCtx.putImageData(changedImage.getImageData(), 0, 0);
    }
  });

}

window.initCanvas = initCanvas;
