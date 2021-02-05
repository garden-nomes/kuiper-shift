import { sprites } from "../asset-bundles";
import { dark, light } from "./colors";
import { furniture } from "./furniture";
import PlantSystem from "./plant-system";

export enum PlantState {
  Happy,
  Thirsty
}

export default class Plant {
  x = 0;
  level = 1;
  hydration = 0.5;
  system = new PlantSystem();
  updateInterval = 1 / 3;
  updateTimer = 0;
  waterTimer = 0;
  growthRate = 0.05;
  highlight = false;
  isWatering = true;
  waterParticles = [];

  constructor() {
    // don't drop in front of bed or shelves
    const minX = furniture.bed.x + furniture.bed.w + 2;
    const maxX = furniture.shelves.x;

    let x = Math.random() * (maxX - furniture.console.w) + minX;

    // don't drop in front of console
    const consoleLeft = furniture.console.x;
    const consoleRight = furniture.console.x + furniture.console.w;
    if (x > consoleLeft && x < consoleRight) {
      x += furniture.console.w;
    }

    this.x = x;
  }

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

  moveUp() {
    this.level = Math.min(this.level + 1, this.yLevels.length - 1);
  }

  moveDown() {
    this.level = Math.max(this.level - 1, 0);
  }

  get yLevels() {
    const { shelf, table } = furniture;

    const levels = [p.height];

    if (this.x > shelf.x && this.x < shelf.x + shelf.w) {
      levels.push(p.height - shelf.h);
    }

    if (this.x > table.x && this.x < table.x + table.w) {
      levels.push(p.height - table.h);
    }

    return levels;
  }

  get y() {
    const possibleLevels = this.yLevels;
    return possibleLevels[Math.min(possibleLevels.length - 1, this.level)];
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
