import { ImageSource, AudioSource, Loader } from "ts-pong/src/loader";

// Assets
// Images
import press1 from "ts-pong/src/assets/images/press1.png";
import press2 from "ts-pong/src/assets/images/press2.png";
import winner from "ts-pong/src/assets/images/winner.png";
// Sounds
import goal from "ts-pong/src/assets/sounds/goal.wav";
import ping from "ts-pong/src/assets/sounds/ping.wav";
import pong from "ts-pong/src/assets/sounds/pong.wav";
import wall from "ts-pong/src/assets/sounds/wall.wav";

const loader = new Loader();

const images = {
  press1: new ImageSource(press1),
  press2: new ImageSource(press2),
  winner: new ImageSource(winner),
};

for (const res in images) {
  loader.addResource(images[res as keyof typeof images]);
}

const sounds = {
  ping: new AudioSource(ping),
  pong: new AudioSource(pong),
  wall: new AudioSource(wall),
  goal: new AudioSource(goal),
};

for (const res in sounds) {
  const sound = sounds[res as keyof typeof sounds];
  sound.volume = 0.5;
  loader.addResource(sound);
}

export { images, sounds, loader };
