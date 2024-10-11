import { World, Runtime, CanvasRenderer, BrowserEventManager, popmotionController } from "@atlas-viewer/atlas";

const renderer = setupContainer(container);
const viewport = { width: 800, height: 600, x: 0, y: 0, scale: 1 };

const world = new World();

const controller = popmotionController({
  minZoomFactor: 0.5,
  maxZoomFactor: 3,
  enableClickToZoom: false
});

const runtime = new Runtime(renderer, world, viewport, [controller]);
new BrowserEventManager(container, runtime);

/*
// Example from the README of Atlas, doesn't work since modules don't exist
const CustomAtlas = createAPI({
  configure: (canvasEl, manifestId) => {
    return {
      data: {
        manifesto: { manifest: manifestId },
      },
      builder: {
        maxColumns: '4',
        spacing: 40,
      },
      controllers: {
        popmotion: {
          el: canvasEl,
        },
      },
      renderers: {
        canvas: {
          el: canvasEl,
        },
      },
    };
  },
  dataSources: [
    require('@atlas-viewer/hyperion-data-source'),
    require('@atlas-viewer/manifesto-data-source'),
  ],
  controllers: [
    require('@atlas-viewer/popmotion-controller'),
    require('@atlas-viewer/keyboard-controller'),
  ],
  builder: require('@atlas-viewer/grid-builder'),
  renderers: [
    require('@atlas-viewer/canvas-renderer'),
    require('@atlas-viewer/debug-renderer'),
  ],
});

const { world, runtime } = new CustomAtlas(
  document.getElementById('canvas'),
  'http://example.org/manifest.json'
);
*/
