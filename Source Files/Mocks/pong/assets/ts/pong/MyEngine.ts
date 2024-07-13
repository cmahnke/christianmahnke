import { Engine, Game, IGameOptions } from "ts-pong/src/engine/Engine";
import { PartialBy } from "ts-pong/src/utils";

export class MyEngine extends Engine {
  hz: number;
  devicePixels: bool;

  constructor(
    game: Game,
    options?: PartialBy<IGameOptions, "canvasElementId">,
  ) {
    super(game, options);
    if ("hz" in (this as any)._options) {
      this.hz = (this as any)._options.hz;
      (this as any)._interval = 1000.0 / this.hz;
      console.log(
        `Setting interval to ${(this as any)._interval}, ${this.hz}Hz`,
      );
    }
    if ("devicePixels" in (this as any)._options) {
      this.devicePixels = (this as any)._options.devicePixels;
      const ratio = window.devicePixelRatio;

      (this as any)._front.width = (this as any)._back.width =
        (this as any)._width * ratio;
      (this as any)._front.height = (this as any)._back.height =
        (this as any)._height * ratio;

      (this as any)._front2d.imageSmoothingEnabled = false;
      (this as any)._back2d.imageSmoothingEnabled = false;

      /*
      (this as any)._front2d.scale(ratio);
      (this as any)._back2d.scale(ratio);
      */

      console.log(`Enabled device pixels`);
    }

    //(this as any)._interval = 1000.0 / ((this as any)._options.fps * 4);
  }
}
