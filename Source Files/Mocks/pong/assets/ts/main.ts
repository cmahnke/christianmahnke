import "ts-pong/src/styles.scss";
import "../scss/base.scss";
import { setupRecorder } from "../js/recorder.js";

import { Engine } from "ts-pong/src/engine/Engine";
import { Pong, loader } from "ts-pong/src/pong";

import { MyPong } from "./pong/MyPong";
import { MyEngine } from "./pong/MyEngine";
//import { images, sounds } from './pong/resources';

const canvasID = "game";
const fps = 60;
const stats = false;
const canvas = document.getElementById(canvasID);

const pong = new MyPong(canvas);
const engine = new MyEngine(pong, {
  fps: fps,
  canvasElementId: canvasID,
  hz: 250,
});

engine.start(loader).then(() => {
  engine.showStats(stats);
  pong.playSounds(false);

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
