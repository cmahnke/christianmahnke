import "ts-pong/src/styles.scss";
import "../scss/base.scss";
import { setupRecorder } from "../js/recorder.js";

import { Engine } from "ts-pong/src/engine/Engine";
import { Pong, loader } from "ts-pong/src/pong";

import { MyPong } from "./pong/MyPong";
//import { images, sounds } from './pong/resources';

const pong = new MyPong();
const fps = 60;
const engine = new Engine(pong, { fps: fps, canvasElementId: "game" });

engine.start(loader).then(() => {
  const stats = document.getElementById("stats") as HTMLInputElement;
  const sound = document.getElementById("sound") as HTMLInputElement;
  const footprints = document.getElementById("footprints") as HTMLInputElement;
  const predictions = document.getElementById(
    "predictions",
  ) as HTMLInputElement;

  engine.showStats(false);
  pong.playSounds(false);

  /*
  pong.showFootprints(footprints?.checked || false);
  pong.showPredictions(predictions?.checked || false);

  stats?.addEventListener("change", () =>
    engine.showStats(stats?.checked || false),
  );
  sound?.addEventListener("change", () =>
    pong.playSounds(sound?.checked || false),
  );
  footprints?.addEventListener("change", () =>
    pong.showFootprints(footprints?.checked || false),
  );
  predictions?.addEventListener("change", () =>
    pong.showPredictions(predictions?.checked || false),
  );
  */

  const gameStop = document.getElementById("game-stop") as HTMLInputElement;
  const gameStart = document.getElementById("game-start") as HTMLInputElement;
  gameStop.addEventListener("click", () => {
    console.log("Stopping game");
    pong.stop();
  });
  gameStart.addEventListener("click", () => {
    console.log("Starting game");
    pong.continuousDemo();
  });
  setupRecorder();
  // Start
  pong.continuousDemo();
});
