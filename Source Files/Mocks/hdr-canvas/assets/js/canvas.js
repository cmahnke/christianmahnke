import {checkHDR, checkHDRCanvas, Uint16Image} from 'hdr-canvas';

const colorSpace = 'rec2100-hlg';

export function loadSDRImage(url) {
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

export function setupCanvas(canvas, width, height) {
  if (width !== undefined && width != 0) {
    canvas.width = width;
  }
  if (height !== undefined && height != 0) {
    canvas.height = height;
  }
  canvas.configureHighDynamicRange({mode:'extended'});
  /* See https://github.com/Fyrd/caniuse/issues/6504#issuecomment-1426886762 */
  const ctx = canvas.getContext("2d", {colorSpace: colorSpace, pixelFormat:'float16'});
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
