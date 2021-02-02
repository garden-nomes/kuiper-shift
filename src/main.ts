import { init, TextAlign, VerticalAlign } from "pota-8";
import fontSrc from "../assets/Gizmo199lightfont.png";
import { sprites, spritesheet } from "../asset-bundles";
import {
  addVec,
  mag,
  magSq,
  mult3x3,
  mult3x3vec,
  normalize,
  pitchMatrix,
  projectToScreen,
  scaleVec,
  sub,
  viewMatrix,
  yawMatrix
} from "./math";

const light = [199, 240, 216];
const dark = [67, 82, 61];

const asteroids: number[][] = [];

const ship = {
  rot: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ],
  pos: [0, 0, 0],
  vel: [0, 0, 0]
};

const miner = {
  x: 2,
  flipX: false,
  walkAnimTimer: 0
};

let isDriving = false;

function turn(pitch: number, yaw: number) {
  ship.rot = mult3x3(pitchMatrix(pitch), mult3x3(yawMatrix(yaw), ship.rot));
}

function accelerateRelative(acc: number[]) {
  ship.vel = addVec(ship.vel, mult3x3vec(ship.rot, acc));
}

let frame = 0;

init({
  showFps: import.meta.env.DEV,

  dimensions: [84, 48],
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

    if (isDriving) {
      // turn ship
      if (p.keyDown("left")) turn(0, p.deltaTime);
      if (p.keyDown("right")) turn(0, -p.deltaTime);
      if (p.keyDown("up")) turn(p.deltaTime, 0);
      if (p.keyDown("down")) turn(-p.deltaTime, 0);

      // accelerate forwards/backwards
      if (p.keyDown("z")) accelerateRelative([0, 0, p.deltaTime]);
      if (p.keyDown("x")) accelerateRelative([0, 0, -p.deltaTime]);

      // cancel driving
      if (p.keyPressed("c")) isDriving = false;
    } else {
      const px = miner.x;

      // move the miner
      if (p.keyDown("left")) miner.x -= p.deltaTime * 16;
      if (p.keyDown("right")) miner.x += p.deltaTime * 16;

      // keep onscreen
      miner.x = Math.min(Math.max(miner.x, 0), p.width - 8);

      // update animation state
      if (px !== miner.x) {
        if (miner.x - px < 0) miner.flipX = true;
        if (miner.x - px > 0) miner.flipX = false;
        miner.walkAnimTimer += p.deltaTime;
      } else {
        miner.walkAnimTimer = 0;
      }

      // add console interaction
      if (miner.x > 36 && miner.x < 50) {
        guiText = ["press c to drive"];
        if (p.keyPressed("c")) isDriving = true;
      }
    }

    // apply linear drag
    if (!isDriving || (!p.keyDown("z") && !p.keyDown("x"))) {
      const speed = mag(ship.vel);

      if (speed > 10e-4) {
        const drag = scaleVec(normalize(ship.vel), -Math.min(p.deltaTime, mag(ship.vel)));
        ship.vel = addVec(drag, ship.vel);
        guiText = ["braking"];
      } else {
        ship.vel = [0, 0, 0];
      }
    } else {
      guiText = ["accelerating"];
    }

    ship.pos = addVec(ship.pos, scaleVec(ship.vel, p.deltaTime));

    const view = viewMatrix(ship.pos, ship.rot);
    for (const [x, y, z] of asteroids) {
      const [sx, sy, sz] = projectToScreen(view, x, y, z);
      if (sz > 0) {
        const r = 8 / (sz + 0.01);

        if (sx + r > 0 && sx - r < p.width && sy + r > 0 && sy - r < p.height) {
          p.circle(sx, sy, 8 / (sz + 0.01), light);
        }
      }
    }

    p.sprite(0, 0, sprites.frame[0]);

    const frame =
      miner.walkAnimTimer > 0
        ? (Math.floor(miner.walkAnimTimer * 8) % (sprites.miner.length - 1)) + 1
        : 0;

    p.sprite(miner.x, p.height - 8, sprites.miner[frame], { flipX: miner.flipX });

    if (guiText) {
      let y = 4;
      for (const line of guiText) {
        if (!line) {
          y += 6;
          continue;
        }

        const w = p.textWidth(line) + 2;
        p.rect(p.width / 2 - w / 2, y - 1, w, 7, dark);
        p.text(line, p.width / 2, y, { color: light, align: TextAlign.Center });
        y += 6;
      }
    }
  }
});
