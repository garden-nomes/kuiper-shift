import { Projection } from "./math";
import { light } from "./colors";

export default class Asteroid {
  radius = Math.random() * 0.5;

  constructor(public pos: number[]) {}

  draw(projection: Projection) {
    const [sx, sy, sz] = projection.projectToScreen(this.pos);

    if (sz > 0) {
      const r = this.radius / (sz + 10e-5);

      if (sx + r > 0 && sx - r < p.width && sy + r > 0 && sy - r < p.height) {
        p.circle(sx, sy, r, { color: light, depth: -sz });
      }
    }
  }
}
