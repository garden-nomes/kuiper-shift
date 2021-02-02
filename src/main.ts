import { init, TextAlign, VerticalAlign } from "pota-8";
import fontSrc from "../assets/Gizmo199lightfont.png";
import { sprites, spritesheet } from "../asset-bundles";
import { Projection } from "./math";
import Ship, { ShipState } from "./ship";
import Miner from "./miner";

const light = [199, 240, 216];
const dark = [67, 82, 61];

const asteroids: number[][] = [];

const ship = new Ship();
const miner = new Miner();

let isDriving = false;

init({
  showFps: import.meta.env.DEV,

  dimensions: [84, 48],
  maxScale: 4,
  crop: true,

  spritesheet,
  font: {
    src: fontSrc,
    w: 5,
    h: 5,
    letters: "!\"# % '()*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz"
  },

  setup() {
    for (let i = 0; i < 100; i++) {
      asteroids.push([
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      ]);
    }
  },

  loop() {
    p.clear(dark);

    let guiText = null;

    ship.hasControl = isDriving;
    miner.hasControl = !isDriving;

    ship.update();
    miner.update();

    if (isDriving) {
      // add titles
      if (ship.state === ShipState.Accelerating) {
        guiText = ["accelerating"];
      } else if (ship.state === ShipState.Braking) {
        guiText = ["braking"];
      }

      // cancel driving
      if (p.keyPressed("c")) isDriving = false;
    } else {
      // add console interaction
      if (miner.x > 36 && miner.x < 50) {
        guiText = ["( c )"];
        if (p.keyPressed("c")) isDriving = true;
      }
    }

    const projection = new Projection(ship.pos, ship.rot, p.width / 2);

    for (const [x, y, z] of asteroids) {
      const [sx, sy, sz] = projection.projectToScreen(x, y, z);
      if (sz > 0) {
        const r = 8 / (sz + 0.01);

        if (sx + r > 0 && sx - r < p.width && sy + r > 0 && sy - r < p.height) {
          p.circle(sx, sy, r, light);
        }
      }
    }

    p.sprite(0, 0, sprites.frame[0]);
    miner.draw();

    if (guiText) {
      let y = 6;
      for (const line of guiText) {
        if (!line) {
          y += 6;
          continue;
        }

        const w = p.textWidth(line) + 2;
        p.rect(p.width / 2 - w / 2, y, w, 5, dark);
        p.text(line, p.width / 2, y, { color: light, align: TextAlign.Center });
        y += 6;
      }
    }
  }
});
