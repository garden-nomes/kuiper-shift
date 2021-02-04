import { init } from "pota-8";
import * as SimplexNoise_ from "simplex-noise";
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
import dither from "./dither";
import Menu from "./menu";

// weird bundling issue
const SimplexNoise: typeof SimplexNoise_ =
  (SimplexNoise_ as any).default || SimplexNoise_;

const noise = new SimplexNoise();
let shakeTimer = 0;

function setupGameState() {
  const asteroids: Asteroid[] = [];
  const particles: ExplosionParticle[] = [];
  const stars: number[][] = [];
  const plants: Plant[] = [];

  const ship = new Ship();
  const miner = new Miner();
  const gui = new Gui();
  const menu = new Menu(ship);

  let isDriving = false;
  let showControls = false;
  let showDamageTimer = 0;
  let deadTimer = 0;
  let dreamBackdrop = 1;
  let isAsleep = false;

  const state = {
    asteroids,
    stars,
    particles,
    plants,
    ship,
    miner,
    gui,
    menu,
    isDriving,
    showControls,
    showDamageTimer,
    deadTimer,
    dreamBackdrop,
    isAsleep
  };

  for (let i = 0; i < 100; i++) {
    asteroids.push(
      new Asteroid([
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
      ])
    );
  }

  for (let i = 0; i < 100; i++) {
    let p = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
    p = Vec3.normalize(p);
    p = Vec3.scale(p, 10e6);
    stars.push([...p, Math.random()]);
  }

  ship.onDamage = () => {
    state.showDamageTimer = 2;
  };

  menu.onContinue = () => {
    state.isAsleep = false;
  };

  menu.onBuyPlant = () => {
    const plant = new Plant(Math.random() * (p.width - 4) + 2);
    plants.push(plant);
  };

  return state;
}

let state = setupGameState();

function reset() {
  state = setupGameState();
}

init({
  // @ts-ignore
  showFps: import.meta.env.DEV,

  dimensions: [84, 48],
  maxScale: 6,
  crop: true,

  spritesheet,
  font: {
    src: fontSrc,
    w: 5,
    h: 5,
    letters: "!\"#¢% '()[]*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz"
  },

  loop() {
    const { ship, miner, plants, asteroids, particles, stars, gui, menu } = state;

    p.clear(state.dreamBackdrop < 1 ? dark : light);

    gui.text = [];

    // track currently mining asteroids (there can be more than one)
    const mining = [];

    if (state.dreamBackdrop > 0 && !state.isAsleep) {
      state.dreamBackdrop -= p.deltaTime * 0.5;
    } else if (state.dreamBackdrop < 1 && state.isAsleep) {
      state.dreamBackdrop += p.deltaTime * 0.5;
    } else if (state.isAsleep) {
      menu.loop();
    } else {
      ship.hasControl = state.isDriving;
      miner.hasControl = !state.isDriving;

      ship.update();
      miner.update();
      plants.forEach(p => p.update());
      particles.forEach(p => p.update());
      state.particles = particles.filter(p => !p.isDead);

      // ship/asteroid interactions
      if (ship.hullIntegrity > 0) {
        for (let i = 0; i < asteroids.length; i++) {
          const distSq = Vec3.magSq(Vec3.sub(asteroids[i].pos, ship.pos));
          const radius = asteroids[i].radius;
          const miningRadius = radius + ship.miningDistance;

          if (distSq < radius * radius) {
            // collision with asteroid
            ship.collideWithAsteroid(asteroids[i]);

            if (ship.hullIntegrity <= 0) {
              for (let j = 0; j < 10; j++) {
                particles.push(new ExplosionParticle(ship.pos));
              }
            }
          } else if (
            state.showDamageTimer <= 0 &&
            ship.ore < 1000 &&
            distSq < miningRadius * miningRadius
          ) {
            // mine asteroid
            asteroids[i].radius -= p.deltaTime * ship.miningRate;
            ship.mine();
            mining.push(asteroids[i]);

            if (asteroids[i].radius <= 0) {
              for (let j = 0; j < 10; j++) {
                particles.push(new ExplosionParticle(asteroids[i].pos));
              }

              asteroids.splice(i, 1);
              i--;
            }

            gui.showMining(ship.ore);
          } else if (ship.ore >= 1000) {
            gui.holdFull();
          }
        }
      }

      if (state.isDriving) {
        // show controls until player starts moving
        if (state.showControls) {
          gui.showDrivingControls();
        }

        if (state.showControls && (p.keyPressed("z") || p.keyPressed("x"))) {
          state.showControls = false;
        }

        // add titles
        if (!gui.text.length) {
          gui.showShipState(ship);
        }

        // cancel driving
        if (p.keyPressed("c")) state.isDriving = false;
      } else {
        if (miner.heldPlant) {
          gui.holdingPlant();

          if (p.keyPressed("x")) {
            miner.heldPlant = null;
          }
        } else {
          // add console interaction
          if (miner.x > 36 && miner.x < 50) {
            gui.interactConsole();

            if (p.keyPressed("c")) {
              state.isDriving = true;
              state.showControls = true;
            }
          }

          // bed interaction
          if (miner.x < 11) {
            gui.interactBed();

            if (p.keyPressed("c")) {
              menu.reset();
              state.isAsleep = true;
            }
          }

          // plant interaction
          const plant = plants.find(p => Math.abs(miner.x - p.x) < 2);

          if (plant) {
            gui.interactPlant(plant);

            if (p.keyPressed("c")) {
              plant.water();
            }

            if (p.keyPressed("x")) {
              miner.heldPlant = plant;
            }
          }
        }
      }

      // show "collision detected" text
      if (state.showDamageTimer > 0) {
        state.showDamageTimer -= p.deltaTime;
        gui.collided(ship);
      }
    }

    if (state.dreamBackdrop < 1) {
      // create exterior camera projection
      const projection = new Projection(ship.pos, ship.rot, p.width / 2);

      // draw stars
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

      // draw asteroids/particles
      asteroids.forEach(a => a.draw(projection));
      particles.forEach(p => p.draw(projection));

      // draw mining lasers
      if (ship.hullIntegrity > 0) {
        mining.forEach(asteroid => {
          const [x1, y1] = projection.projectToScreen(asteroid.pos);
          p.line(0, p.height, x1, y1, light);
          p.line(0, p.height - 1, x1, y1 - 1, dark);
          p.line(p.width, p.height, x1, y1, light);
          p.line(p.width, p.height - 1, x1, y1 - 1, dark);
        });
      }

      // undo screen shake for interior
      p.center(p.width / 2, p.height / 2);

      // draw interior
      if (ship.hullIntegrity > 0) {
        p.sprite(0, 0, sprites.frame[0]);
        plants.forEach(p => p.draw());
        miner.draw();
        gui.draw();
      }

      // draw the fade in/out effect
      if (state.dreamBackdrop > 0) {
        for (let x = 0; x < p.width; x++) {
          for (let y = 0; y < p.height; y++) {
            const dx = x - 8;
            const dy = y - (p.height - 4);
            const dist = Math.sqrt(dx * dx + dy * dy);

            const w = 40;
            const t = (dist + w - (1 - state.dreamBackdrop) * (p.width * 2)) / w;

            if (dither(x, y, t)) {
              p.pixel(x, y, light);
            }
          }
        }
      }
    }

    // reset if ship exploded
    if (ship.hullIntegrity <= 0) {
      state.deadTimer += p.deltaTime;

      if (state.deadTimer > 3) {
        reset();
      }
    }
  }
});
