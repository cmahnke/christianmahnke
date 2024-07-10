import "ts-pong/src/styles.scss";
import "../scss/base.scss";

import { Engine } from "ts-pong/src/engine/Engine";
import { Pong, loader } from "ts-pong/src/pong";

import { MyPong } from "./pong/MyPong";
//import { images, sounds } from './pong/resources';

const pong = new MyPong();
const engine = new Engine(pong, { canvasElementId: "game" });

engine.start(loader).then(() => {
  const stats = document.getElementById("stats") as HTMLInputElement;
  const sound = document.getElementById("sound") as HTMLInputElement;
  const footprints = document.getElementById("footprints") as HTMLInputElement;
  const predictions = document.getElementById(
    "predictions",
  ) as HTMLInputElement;

  engine.showStats(false);
  pong.playSounds(sound.checked);
  pong.showFootprints(footprints.checked);
  pong.showPredictions(predictions.checked);

  stats.addEventListener("change", () => engine.showStats(stats.checked));
  sound.addEventListener("change", () => pong.playSounds(sound.checked));
  footprints.addEventListener("change", () =>
    pong.showFootprints(footprints.checked),
  );
  predictions.addEventListener("change", () =>
    pong.showPredictions(predictions.checked),
  );
});
