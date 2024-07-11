import { Engine, Game, IGameOptions } from "ts-pong/src/engine/Engine";
import { PartialBy } from "ts-pong/src/utils";

export class MyEngine extends Engine {
  hz: number;

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

    //(this as any)._interval = 1000.0 / ((this as any)._options.fps * 4);
  }
}
