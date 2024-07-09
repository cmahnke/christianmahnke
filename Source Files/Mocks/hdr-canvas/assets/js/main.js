import {setupCanvas, loadSDRImage} from "./canvas";
import {Uint16Image} from 'hdr-canvas';

function initCanvas(canvas, imageUrl) {
  loadSDRImage(imageUrl)
  .then((imageData) => {
    hdrCtx = setupCanvas(canvas, imageData.width, imageData.height);
    rec210hglImage = Uint16Image.fromImageData(imageData);
    hdrCtx.putImageData(rec210hglImage.getImageData(), 0, 0);
  });
}

const colors = {'red': 0, 'green': 0, 'blue': 0};
let rec210hglImage, hdrCtx

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

const imageUrl = '/images/sample.jpeg';
const canvas = document.querySelector('#renderer');

initCanvas(canvas, imageUrl);
