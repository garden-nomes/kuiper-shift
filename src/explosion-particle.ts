import { Projection, Vec3 } from "./math";
import { light, dark } from "./colors";

export default class ExplosionParticle {
  vel: number[];
  lifespan = Math.random() * 4;
  isDead = false;

  constructor(private pos: number[]) {
    this.vel = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
    this.vel = Vec3.scale(Vec3.normalize(this.vel), Math.random() + 0.5);
  }

  update() {
    this.lifespan -= p.deltaTime;

    if (this.lifespan <= 0) {
      this.isDead = true;
    }

    this.pos = Vec3.add(this.pos, Vec3.scale(this.vel, p.deltaTime));
  }

  draw(projection: Projection) {
    const [sx, sy, sz] = projection.projectToScreen(this.pos);

    if (sz > 0) {
      const flipColor = (p.elapsed * 30) % 2 > 1;
      const c = flipColor ? light : dark;
      p.pixel(sx, sy, c);
    }
  }
}
