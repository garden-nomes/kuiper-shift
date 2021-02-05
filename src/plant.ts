import { sprites } from "../asset-bundles";
import { dark, light } from "./colors";
import { furniture } from "./furniture";
import PlantSystem from "./plant-system";

export enum PlantState {
  Happy,
  Thirsty
}

export default class Plant {
  hydration = 0.5;
  system = new PlantSystem();
  updateInterval = 1 / 3;
  updateTimer = 0;
  waterTimer = 0;
  growthRate = 0.05;
  highlight = false;
  isWatering = true;
  waterParticles = [];

  constructor(public x: number) {}

  update() {
    this.hydration -= p.deltaTime * 0.01;
    this.hydration = Math.min(Math.max(this.hydration, 0), 1.02);

    this.updateTimer += this.growthRate * p.deltaTime * this.hydration * 2;

    if (this.updateTimer > this.updateInterval) {
      this.system.iterate(this.updateTimer);
      this.updateTimer = 0;
    }

    if (this.hydration > 1) {
      this.waterTimer += p.deltaTime;
      if (this.waterTimer > 0.2) {
        this.waterTimer = 0;
        this.waterParticles.push([this.x, this.y - 4, Math.random() > 0.5 ? -1 : 1]);
      }
    } else {
      this.waterTimer = 0;
    }

    for (const particle of this.waterParticles) {
      if (~~particle[0] > ~~this.x - 3 && ~~particle[0] < ~~this.x + 2) {
        particle[0] += particle[2] * 10 * p.deltaTime;
      } else {
        particle[1] += 10 * p.deltaTime;
      }
    }

    for (let i = 0; i < this.waterParticles.length; i++) {
      if (this.waterParticles[i][1] > p.height) {
        this.waterParticles.splice(i, 1);
        i--;
      }
    }
  }

  get y() {
    const { shelf, table } = furniture;

    if (this.x > shelf.x && this.x < shelf.x + shelf.w) {
      return p.height - shelf.h;
    }

    if (this.x > table.x && this.x < table.x + table.w) {
      return p.height - table.h;
    }

    return p.height;
  }

  state() {
    if (this.hydration < 0.5) {
      return PlantState.Thirsty;
    } else {
      return PlantState.Happy;
    }
  }

  water() {
    this.hydration += 1;
    this.hydration = Math.min(this.hydration, 1.5);
  }

  draw() {
    const pot = sprites.pot[0];
    this.system.draw(this.x, this.y - 3, this.highlight);
    p.sprite(this.x - pot.w / 2, this.y - pot.h, pot);

    for (const [x, y] of this.waterParticles) {
      const c = p.frame % 2 === 0 ? light : dark;
      p.pixel(x, y, c);
    }
  }
}
