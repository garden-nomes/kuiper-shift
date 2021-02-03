import { init } from "pota-8";
import * as SimplexNoise from "simplex-noise";
import fontSrc from "../assets/Gizmo199lightfont.png";
import { sprites, spritesheet } from "../asset-bundles";
import { Projection, Vec3 } from "./math";
import Ship from "./ship";
import Miner from "./miner";
import { light, dark } from "./colors";
import Asteroid from "./asteroid";
import Plant from "./plant";
import ExplosionParticle from "./explosion-particle";
import Gui from "./gui";

const noise = new SimplexNoise();
let shakeTimer = 0;

function setupGameState() {
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
    p = Vec3.scale(p, 10e6);
    stars.push([...p, Math.random()]);
  }

  let particles: ExplosionParticle[] = [];

  const ship = new Ship();
  const miner = new Miner();
  const plant = new Plant(21, 48);
  const gui = new Gui();

  let isDriving = false;
  let showControls = false;
  let showDamageTimer = 0;

  const state = {
    asteroids,
    stars,
    particles,
    ship,
    miner,
    plant,
    gui,
    isDriving,
    showControls,
    showDamageTimer
  };

  ship.onDamage = () => {
    state.showDamageTimer = 2;
  };

  return state;
}

export const state = setupGameState();

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

  loop() {
    const { ship, miner, plant, asteroids, particles, stars, gui } = state;
    p.clear(dark);

    gui.text = [];

    ship.hasControl = state.isDriving;
    miner.hasControl = !state.isDriving;

    ship.update();
    miner.update();
    plant.update();

    const mining = [];

    for (let i = 0; i < asteroids.length; i++) {
      const distSq = Vec3.magSq(Vec3.sub(asteroids[i].pos, ship.pos));
      const radius = asteroids[i].radius;
      const { miningDistance, miningRate } = ship;

      if (distSq < radius * radius) {
        ship.collideWithAsteroid(asteroids[i]);
      } else if (
        state.showDamageTimer <= 0 &&
        distSq < (radius + miningDistance) * (radius + miningDistance)
      ) {
        asteroids[i].radius -= p.deltaTime * miningRate;
        ship.ore += p.deltaTime * 10;
        mining.push(asteroids[i]);

        if (asteroids[i].radius <= 0) {
          for (let j = 0; j < 10; j++) {
            particles.push(new ExplosionParticle(asteroids[i].pos));
          }

          asteroids.splice(i, 1);
          i--;
        }

        gui.showMining(ship.ore);
      }
    }

    particles.forEach(p => p.update());
    state.particles = particles.filter(p => !p.isDead);

    if (state.isDriving) {
      // show controls until player starts moving
      if (state.showControls) {
        gui.showDrivingControls();
      }

      if (state.showControls && (p.keyPressed("z") || p.keyPressed("x"))) {
        state.showControls = false;
      }

      // add titles
      if (!gui.text) {
        gui.showShipState(ship);
      }

      // cancel driving
      if (p.keyPressed("c")) state.isDriving = false;
    } else {
      // add console interaction
      if (miner.x > 36 && miner.x < 50) {
        gui.interactConsole();

        if (p.keyPressed("c")) {
          state.isDriving = true;
          state.showControls = true;
        }
      }

      // plant interaction
      if (!miner.heldPlant && Math.abs(miner.x - plant.x) < 2) {
        gui.interactPlant(plant);

        if (p.keyPressed("c")) {
          plant.water();
        }

        if (p.keyPressed("x")) {
          miner.heldPlant = plant;
        }
      } else if (miner.heldPlant) {
        gui.holdingPlant();

        if (p.keyPressed("x")) {
          miner.heldPlant = null;
        }
      }
    }

    // show "collision detected" text
    if (state.showDamageTimer > 0) {
      state.showDamageTimer -= p.deltaTime;
      gui.collided(ship);
    }

    const projection = new Projection(ship.pos, ship.rot, p.width / 2);

    for (const starPos of stars) {
      const [sx, sy, sz] = projection.projectToScreen(starPos);
      if (sz > 0) {
        p.pixel(sx, sy, light);
      }
    }

    // add screen shake
    const dmgShake = Math.max(0, state.showDamageTimer * state.showDamageTimer);
    shakeTimer += p.deltaTime * dmgShake * 4;
    const shakeX = noise.noise2D(10e4, shakeTimer) * (1 + dmgShake * 0.5);
    const shakeY = noise.noise2D(10e5, shakeTimer) * (1 + dmgShake * 0.5);
    p.center(p.width / 2 + shakeX, p.height / 2 + shakeY);

    asteroids.forEach(a => a.draw(projection));
    particles.forEach(p => p.draw(projection));

    // draw mining lasers
    mining.forEach(asteroid => {
      const [x1, y1] = projection.projectToScreen(asteroid.pos);
      p.line(0, p.height, x1, y1, light);
      p.line(0, p.height - 1, x1, y1 - 1, dark);
      p.line(p.width, p.height, x1, y1, light);
      p.line(p.width, p.height - 1, x1, y1 - 1, dark);
    });

    // draw foreground
    p.center(p.width / 2, p.height / 2);
    p.sprite(0, 0, sprites.frame[0]);
    plant.draw();
    miner.draw();
    gui.draw();
  }
});
