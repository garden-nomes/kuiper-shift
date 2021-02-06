import { init, TextAlign, VerticalAlign } from "pota-8";
import * as SimplexNoise_ from "simplex-noise";
import fontSrc from "../assets/font.png";
import { sprites, spritesheet } from "../asset-bundles";
import { Matrix, Projection, raycastSphere, Vec3 } from "./math";
import Ship from "./ship";
import Miner from "./miner";
import { light, dark } from "./colors";
import Asteroid from "./asteroid";
import Plant from "./plant";
import ExplosionParticle from "./explosion-particle";
import Gui from "./gui";
import Menu from "./menu";
import drawHud from "./draw-hud";
import drawFade from "./draw-fade";
import audio from "./audio";

const isDev = import.meta.env.DEV;

// weird bundling issue
const SimplexNoise: typeof SimplexNoise_ =
  (SimplexNoise_ as any).default || SimplexNoise_;

const noise = new SimplexNoise();
let shakeTimer = 0;

init({
  showFps: isDev,
  dimensions: [84, 48],
  maxScale: 6,
  crop: true,
  spritesheet,
  font: {
    src: fontSrc,
    w: 5,
    h: 5,
    letters: "!\"#¢% '()[]*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz←→↑↓ⓏⓍⒸ"
  },
  loop
});

function setupGameState(isReset = false) {
  const asteroids: Asteroid[] = [];
  const particles: ExplosionParticle[] = [];
  const stars: number[][] = [];
  const plants: Plant[] = [];
  const ship = new Ship();
  const miner = new Miner();
  const gui = new Gui();
  const menu: Menu | null = null;

  const state = {
    asteroids,
    stars,
    particles,
    plants,
    ship,
    miner,
    gui,
    menu,
    isDriving: false,
    showControls: false,
    showDamageTimer: 0,
    deadTimer: 0,
    menuFadeInTimer: 0,
    dreamBackdrop: 1,
    isAsleep: false,
    isTitleScreen: true,
    titleFadeOut: false,
    titleFadeOutTimer: isReset ? 1 : 0,
    holdFullBeepTimer: 0,
    miningParticleTimer: 0,
    hasCalendar: false,
    isCheckingCalendar: false,
    day: 128
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
    audio.playOneShot("crash");
  };

  return state;
}

let state = setupGameState();

function reset() {
  state = setupGameState(true);
}

function gotoMenu() {
  state.menu = new Menu(
    {
      hull: state.ship.hullIntegrity,
      ore: state.ship.ore,
      credits: state.ship.credits
    },
    state.hasCalendar
  );

  state.menu.onContinue = (resources, purchases) => {
    state.ship.hullIntegrity = resources.hull;
    state.ship.ore = resources.ore;
    state.ship.credits = resources.credits;

    for (let i = 0; i < purchases.plants; i++) {
      state.plants.push(new Plant());
    }

    if (purchases.calendar) {
      state.hasCalendar = true;
    }

    state.isAsleep = false;
    state.day++;
    audio.playOneShot("wake");
  };

  state.isAsleep = true;
  state.menuFadeInTimer = 0;
  state.holdFullBeepTimer = 0;
  audio.playOneShot("sleep");
}

function loop() {
  const { ship, miner, plants, asteroids, particles, stars, gui } = state;

  p.clear(state.isTitleScreen || state.dreamBackdrop < 1 ? dark : light);

  gui.text = [];

  // cheats
  if (isDev && p.keyPressed("space")) {
    ship.credits += 10;
    ship.ore += 100;
  }

  // track closest asteroid for GUI
  let asteroidDistance: number | null = null;
  let closestAsteroid: Asteroid | null = null;
  let isMining = false;

  if (state.isTitleScreen) {
    ship.rot = Matrix.yaw(p.elapsed * 0.05);
    ship.pos = Matrix.mult3x3vec(ship.rot, [0, 0, -5]);

    if (p.keyPressed("c")) {
      state.titleFadeOut = true;
    }

    if (state.titleFadeOut) {
      state.titleFadeOutTimer += p.deltaTime;
      if (state.titleFadeOutTimer > 1) {
        state.isTitleScreen = false;
        ship.pos = [0, 0, 0];
        audio.playOneShot("wake");
      }
    } else if (state.titleFadeOutTimer > 0) {
      state.titleFadeOutTimer -= p.deltaTime;
    }
  } else if (state.dreamBackdrop > 0 && !state.isAsleep) {
    state.dreamBackdrop -= p.deltaTime;

    // animate miner moving away from bed
    if (state.dreamBackdrop < 0.3) {
      miner.moveRightOverride = true;
      miner.hasControl = false;
      miner.update();
    } else {
      miner.x = 4;
    }
  } else if (state.isAsleep) {
    if (state.dreamBackdrop < 1) {
      state.dreamBackdrop += p.deltaTime;
    } else {
      state.menu.update();
      ship.rot = Matrix.yaw(p.elapsed * 0.05);
      ship.pos = Matrix.mult3x3vec(ship.rot, [0, 0, -5]);
      state.menuFadeInTimer += p.deltaTime;
    }
  } else {
    ship.hasControl = state.isDriving;
    miner.hasControl = !state.isDriving;
    miner.moveRightOverride = false;

    ship.update();
    miner.update();
    plants.forEach(p => p.update());
    particles.forEach(p => p.update());

    for (let i = 0; i < particles.length; i++) {
      if (particles[i].isDead) {
        particles.splice(i, 1);
        i--;
      }
    }

    // ship/asteroid interactions
    if (ship.hullIntegrity > 0) {
      for (let i = 0; i < asteroids.length; i++) {
        // racast asteroid, update closest
        const raycast = raycastSphere(
          ship.pos,
          ship.forward,
          asteroids[i].pos,
          asteroids[i].radius + 0.1
        );

        if (
          raycast !== null &&
          (asteroidDistance === null || raycast < asteroidDistance)
        ) {
          asteroidDistance = raycast;
          closestAsteroid = asteroids[i];
        }

        // collide with asteroid
        const distSq = Vec3.magSq(Vec3.sub(asteroids[i].pos, ship.pos));
        const radius = asteroids[i].radius;
        if (distSq < radius * radius) {
          ship.collideWithAsteroid(asteroids[i]);

          if (ship.hullIntegrity <= 0) {
            for (let j = 0; j < 10; j++) {
              particles.push(new ExplosionParticle(ship.pos));
            }
          }
        }
      }
    }

    const canMine = state.showDamageTimer <= 0 && ship.ore < 1000;
    const isAsteroidInRange =
      asteroidDistance !== null && asteroidDistance <= ship.miningDistance;
    isMining = canMine && isAsteroidInRange;

    // mine asteroid if within range
    if (isMining) {
      ship.mine(closestAsteroid);

      if (closestAsteroid.radius <= 0) {
        audio.playOneShot("thud");
        asteroids.splice(asteroids.indexOf(closestAsteroid), 1);
      }

      state.miningParticleTimer += p.deltaTime;
      if (state.miningParticleTimer > 0.05) {
        state.miningParticleTimer = 0;
        const pos = Vec3.add(ship.pos, Vec3.scale(ship.forward, asteroidDistance));

        for (let i = 0; i < 3; i++) {
          particles.push(new ExplosionParticle(pos));
        }
      }

      gui.showMining(ship.ore);
    } else {
      state.miningParticleTimer = 0;
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

      // show "hold full" message
      if (ship.ore >= 1000) {
        gui.holdFull();

        state.holdFullBeepTimer -= p.deltaTime;
        if (state.holdFullBeepTimer <= 0) {
          audio.playOneShot("three-beep");
          state.holdFullBeepTimer = 3;
        }
      }

      // cancel driving
      if (p.keyPressed("c")) {
        state.isDriving = false;
        audio.playOneShot("off");
      }
    } else {
      plants.forEach(p => {
        p.highlight = false;
      });

      if (miner.heldPlant) {
        gui.holdingPlant(miner.heldPlant.possiblePlacements.length > 1);

        if (p.keyPressed("x")) {
          miner.heldPlant = null;
          audio.playOneShot("thud");
        }
      } else if (miner.wateringPlant) {
        if (p.keyReleased("c")) {
          miner.wateringPlant = null;
        }
      } else {
        // add console interaction
        if (miner.x > 36 && miner.x < 50) {
          gui.interactConsole();

          if (p.keyPressed("c")) {
            state.isDriving = true;
            state.showControls = true;
            audio.playOneShot("on");
          }
        }

        // calendar interaction
        if (state.hasCalendar && miner.x > 15 && miner.x <= 19) {
          if (state.isCheckingCalendar) {
            gui.calendarText(state.day);
          } else {
            gui.interactCalendar();

            if (p.keyPressed("c")) {
              state.isCheckingCalendar = true;
            }
          }
        } else {
          state.isCheckingCalendar = false;
        }

        // bed interaction
        if (miner.x < 11) {
          gui.interactBed();

          if (p.keyPressed("c")) {
            gotoMenu();
          }
        }

        // plant interaction
        const plant = plants.find(p => Math.abs(miner.x - p.x) < 2);
        if (plant) {
          plant.highlight = true;
          gui.interactPlant(plant);

          if (p.keyPressed("c")) {
            miner.wateringPlant = plant;
          }

          if (p.keyPressed("x")) {
            miner.heldPlant = plant;
            audio.playOneShot("thud");
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

  if (state.isTitleScreen || state.dreamBackdrop < 1 || state.isAsleep) {
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
    asteroids.forEach(a => a.draw(projection, state.isAsleep));
    particles.forEach(p => p.draw(projection));

    // undo screen shake for interior
    p.center(p.width / 2, p.height / 2);

    // draw interior
    if (ship.hullIntegrity > 0 && !state.isTitleScreen && !state.isAsleep) {
      // hud
      if (state.isDriving) {
        drawHud(ship, asteroidDistance, isMining);
      }

      // frame
      p.sprite(0, 0, sprites.frame[0]);

      // calendar
      if (state.hasCalendar) {
        p.sprite(16, 41, sprites.calendar[0]);
      }

      // console screen
      if (state.isDriving) {
        p.sprite(39, 36, sprites.screen[0]);

        // draw over sprite to create animated text effect
        for (let x = 41; x < 46; x++) {
          if (noise.noise3D(x, 0, p.elapsed * 0.25) > 0.5) {
            p.pixel(x, 37, dark);
          }

          if (noise.noise3D(x, 1, p.elapsed * 0.25) > 0.5) {
            p.pixel(x, 39, dark);
          }
        }
      }

      // plants
      plants.forEach(p => p.draw());

      // miner
      miner.draw();

      // text
      gui.draw();
    }
  }

  if (state.isTitleScreen) {
    let ox = Math.round(Math.cos(p.elapsed));
    let oy = Math.round(Math.sin(p.elapsed + 0.2));

    p.circle(p.width / 2 + ox, 14 + oy, 18, light);

    const title = sprites.title[0];
    p.sprite(p.width / 2 - title.w / 2 + 1, 10, title);

    for (let lx = 22; lx < 55; lx++) {
      if (noise.noise2D(lx, p.elapsed * 0.5) < 0.5) {
        p.pixel(lx, 8, dark);
      }
    }

    for (let lx = 32; lx < 61; lx++) {
      if (noise.noise2D(lx, p.elapsed * 0.5) < 0.5) {
        p.pixel(lx, 23, dark);
      }
    }

    if (p.elapsed % 2 < 4 / 3) {
      // prettier-ignore
      // text shadow effect
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        p.text("Ⓒ start", p.width / 2 + ox, p.height - 6 + oy, {
          color: dark,
          align: TextAlign.Center,
          verticalAlign: VerticalAlign.Bottom
        });
      }

      // fills in some awkward gaps in the text shadow
      p.rect(p.width / 2 - 4, p.height - 9, 17, 3, dark);

      p.text("Ⓒ start", p.width / 2, p.height - 6, {
        color: light,
        align: TextAlign.Center,
        verticalAlign: VerticalAlign.Bottom
      });
    }
  } else if (state.isAsleep && state.dreamBackdrop >= 1) {
    state.menu.draw();
  }

  // draw the fade in/out effect
  if (state.dreamBackdrop > 0 && state.dreamBackdrop < 1) {
    drawFade(1 - state.dreamBackdrop, light, [8, p.height - 4]);
  }

  if (state.menuFadeInTimer > 0 && state.menuFadeInTimer < 0.5) {
    drawFade(1 - state.menuFadeInTimer * 2, light);
  }

  if (state.isTitleScreen && state.titleFadeOutTimer > 0) {
    drawFade(state.titleFadeOutTimer, light);
  }

  // reset if ship exploded
  if (ship.hullIntegrity <= 0) {
    state.deadTimer += p.deltaTime * 0.5;

    if (state.deadTimer > 1) {
      drawFade((state.deadTimer - 1) / 2, light, [p.width / 2, p.height / 2], true);
    }

    if (state.deadTimer > 3) {
      reset();
    }
  }

  // background audio
  audio.setBackground(null);

  if (state.isTitleScreen) {
    audio.setBackground("claire-de-lune", 0.5);
  } else if (miner.wateringPlant) {
    audio.setBackground("blip-1", 0.5);
  } else if (isMining) {
    audio.setBackground("laser", 0.5);
  } else if (ship.isMoving) {
    const volume = Math.min(Vec3.magSq(ship.vel), 3);
    audio.setBackground("rumble", volume);
  }

  audio.update();
}
