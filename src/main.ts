import { init, TextAlign, VerticalAlign } from "pota-8";
import fontSrc from "../assets/Gizmo199lightfont.png";
import { sprites, spritesheet } from "../asset-bundles";
import { Projection, Vec3 } from "./math";
import Ship, { ShipState } from "./ship";
import Miner from "./miner";

const light = [199, 240, 216];
const dark = [67, 82, 61];

class Asteroid {
  size = Math.random() * 5 + 5;

  constructor(public pos: number[]) {}

  draw(projection: Projection) {
    const [sx, sy, sz] = projection.projectToScreen(this.pos);

    if (sz > 0) {
      const r = this.size / (sz + 0.01);

      if (sx + r > 0 && sx - r < p.width && sy + r > 0 && sy - r < p.height) {
        p.circle(sx, sy, r, { color: light, depth: -sz });
      }
    }
  }
}

const asteroids: Asteroid[] = [];

for (let i = 0; i < 100; i++) {
  asteroids.push(
    new Asteroid([
      Math.random() * 20 - 10,
      Math.random() * 20 - 10,
      Math.random() * 20 - 10
    ])
  );
}

const stars: number[][] = [];

for (let i = 0; i < 100; i++) {
  let p = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
  p = Vec3.normalize(p);
  p = Vec3.scale(p, 1000);
  stars.push([...p, Math.random()]);
}

class Particle {
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

let particles: Particle[] = [];

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

  setup() {},

  loop() {
    p.clear(dark);

    let guiText = null;

    ship.hasControl = isDriving;
    miner.hasControl = !isDriving;

    ship.update();
    miner.update();

    const mining = [];

    for (let i = 0; i < asteroids.length; i++) {
      const distSq = Vec3.magSq(Vec3.sub(asteroids[i].pos, ship.pos));
      if (distSq < 0.3 * 0.3) {
        for (let j = 0; j < 30; j++) {
          particles.push(new Particle(asteroids[i].pos));
        }

        asteroids.splice(i, 1);
        i--;
      } else if (distSq < 0.5 * 0.5) {
        mining.push(asteroids[i]);
        asteroids[i].size -= p.deltaTime;

        if (asteroids[i].size <= 0) {
          for (let j = 0; j < 10; j++) {
            particles.push(new Particle(asteroids[i].pos));
          }

          asteroids.splice(i, 1);
          i--;
        }

        if (p.elapsed % 1 < 2 / 3) {
          guiText = ["mining", null, "proximity", "warning"];
        } else {
          guiText = ["mining"];
        }
      }
    }

    particles.forEach(p => p.update());
    particles = particles.filter(p => !p.isDead);

    if (isDriving) {
      // add titles
      if (!guiText) {
        if (ship.state === ShipState.Accelerating) {
          guiText = ["accelerating"];
        } else if (ship.state === ShipState.Braking) {
          guiText = ["braking"];
        }
      }

      // cancel driving
      if (p.keyPressed("c")) isDriving = false;
    } else {
      // add console interaction
      if (miner.x > 36 && miner.x < 50) {
        guiText = ["<c> drive"];
        if (p.keyPressed("c")) isDriving = true;
      }
    }

    const projection = new Projection(ship.pos, ship.rot, p.width / 2);

    for (const starPos of stars) {
      const [sx, sy, sz] = projection.projectToScreen(starPos);
      if (sz > 0) {
        p.pixel(sx, sy, light);
      }
    }

    asteroids.forEach(a => a.draw(projection));
    particles.forEach(p => p.draw(projection));

    mining.forEach(asteroid => {
      const [x1, y1] = projection.projectToScreen(asteroid.pos);
      p.line(0, p.height, x1, y1, light);
      p.line(0, p.height - 1, x1, y1 - 1, dark);
      p.line(p.width, p.height, x1, y1, light);
      p.line(p.width, p.height - 1, x1, y1 - 1, dark);
    });

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
