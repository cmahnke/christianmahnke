import { images, sounds } from "./resources";
import { Pong, Config } from "ts-pong/src/pong/Pong";
import { Menu } from "ts-pong/src/pong/Menu";

export class MyPong extends Pong {
  //private _menu: Menu;

  constructor() {
    super();

    /* See https://stackoverflow.com/a/72510449 */
    (this as any)._menu = new Menu({
      images: images,
      width: Config.width,
      wallWidth: Config.wallWidth,
    });
  }
}
