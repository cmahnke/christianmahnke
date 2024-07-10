import { images, sounds } from "./resources";
import { Pong, Config, PlayerNumber } from "ts-pong/src/pong/Pong";

import { Ball } from "ts-pong/src/pong/Ball";
import { Court } from "ts-pong/src/pong/Court";
import { Menu } from "ts-pong/src/pong/Menu";
import { Paddle } from "ts-pong/src/pong/Paddle";

const speedDevider = 12;

const MyConfig = {
  width: Config.width,
  height: Config.height,
  wallWidth: Config.wallWidth,
  paddleWidth: Config.paddleWidth,
  paddleHeight: Config.paddleHeight,
  paddleSpeed: Config.paddleSpeed / speedDevider,
  ballSpeed: Config.ballSpeed / speedDevider,
  ballAccel: Config.ballAccel,
  ballRadius: Config.ballRadius,
  playSounds: false,
  showFootprints: Config.showFootprints,
  showPredications: Config.showPredications,
} as const;

export class MyPong extends Pong {
  //private _menu: Menu;
  public stopped: boolean = false;

  constructor() {
    super();
    (this as any)._playSounds = false;

    const paddleOptions = {
      paddleWidth: MyConfig.paddleWidth,
      paddleHeight: MyConfig.paddleHeight,
      paddleSpeed: MyConfig.paddleSpeed,
      wallWidth: MyConfig.wallWidth,
      height: MyConfig.height,
      width: MyConfig.width,
      showPredictions: MyConfig.showPredications,
    };
    (this as any)._leftPaddle = new Paddle(
      Object.assign({}, paddleOptions, {
        rightHandSide: false,
      }),
    );
    (this as any)._rightPaddle = new Paddle(
      Object.assign({}, paddleOptions, {
        rightHandSide: true,
      }),
    );
    (this as any)._ball = new Ball({
      ballRadius: MyConfig.ballRadius,
      width: MyConfig.width,
      height: MyConfig.height,
      wallWidth: MyConfig.wallWidth,
      ballSpeed: MyConfig.ballSpeed,
      ballAccel: MyConfig.ballAccel,
      footprints: MyConfig.showFootprints,
    });

    (this as any)._court = new Court({
      width: MyConfig.width,
      height: MyConfig.height,
      wallWidth: MyConfig.wallWidth,
    });

    /* See https://stackoverflow.com/a/72510449 */
    (this as any)._menu = new Menu({
      images: images,
      width: MyConfig.width,
      wallWidth: MyConfig.wallWidth,
    });
  }

  goal(playerNumber: PlayerNumber) {
    this.sounds("goal");
    (this as any)._scores[playerNumber] += 1;
    if ((this as any)._scores[playerNumber] == 9) {
      (this as any)._menu.declareWinner(playerNumber);
      this.stop();
      console.log(`Player ${playerNumber} won!`);
    } else {
      (this as any)._ball.reset(playerNumber);
      (this as any)._leftPaddle.setLevel(this.level(0));
      (this as any)._rightPaddle.setLevel(this.level(1));
    }
  }

  continuousDemo() {
    this.stopped = false;
    setInterval(() => {
      var playing = (this as any)._playing;
      if (!playing && !this.stopped) {
        console.log("(Re-)starting demo.");
        this.start(0);
        //this.startDemo();
      }
    }, 500);
  }

  stop() {
    (this as any)._playing = false;
    (this as any).stopped = true;
    (this as any)._leftPaddle.setAuto(false);
    (this as any)._rightPaddle.setAuto(false);
  }
}
