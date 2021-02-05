import { Projection, Vec3 } from "./math";
import { light, dark } from "./colors";

export default class ExplosionParticle {
  vel: number[];
  lifespan = Math.random() * 0.3;
  isDead = false;

  constructor(private pos: number[]) {
    this.vel = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
    this.vel = Vec3.scale(Vec3.normalize(this.vel), 2);
  }

  update() {
    this.lifespan -= p.deltaTime;

    if (this.lifespan <= 0) {
      this.isDead = true;
    }

    this.vel = Vec3.scale(this.vel, 0.95);
    this.pos = Vec3.add(this.pos, Vec3.scale(this.vel, p.deltaTime));
  }

  draw(projection: Projection) {
    const [x0, y0, z] = projection.projectToScreen(this.pos);
    const [x1, y1] = projection.projectToScreen(
      Vec3.add(this.pos, Vec3.scale(this.vel, 0.01))
    );

    if (z > 0) {
      const c = p.frame % 2 === 0 ? light : dark;
      p.line(x0, y0, x1, y1, c);
    }
  }
}
