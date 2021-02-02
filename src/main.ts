import { init, TextAlign, VerticalAlign } from "pota-8";
import fontSrc from "../assets/Gizmo199lightfont.png";
import {
  addVec,
  mult3x3,
  mult3x3vec,
  pitchMatrix,
  projectToScreen,
  scaleVec,
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

function turn(pitch: number, yaw: number) {
  ship.rot = mult3x3(pitchMatrix(pitch), mult3x3(yawMatrix(yaw), ship.rot));
}

function accelerate(acc: number[]) {
  ship.vel = addVec(ship.vel, mult3x3vec(ship.rot, acc));
}

let frame = 0;

init({
  showFps: import.meta.env.DEV,

  dimensions: [84, 48],
  crop: true,

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

    if (p.keyDown("left")) turn(0, p.deltaTime);
    if (p.keyDown("right")) turn(0, -p.deltaTime);
    if (p.keyDown("up")) turn(p.deltaTime, 0);
    if (p.keyDown("down")) turn(-p.deltaTime, 0);

    if (p.keyDown("z")) accelerate([0, 0, p.deltaTime]);
    if (p.keyDown("x")) accelerate([0, 0, -p.deltaTime]);

    ship.vel = scaleVec(ship.vel, 1 - p.deltaTime * 2);
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
  }
});
