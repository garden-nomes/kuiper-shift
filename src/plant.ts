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
  highlight = false;
  hydration = 0.5;

  private lastYPlacement = 0;

  private system = new PlantSystem();
  private readonly systemUpdateInterval = 0.5;

  private updateTimer = 0;
  private waterTimer = 0;

  private readonly growthRate = 0.05;
  private readonly dehydrationRate = 0.01;

  private waterParticles = [];
  private readonly dripSeconds = 5;

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
    this.hydration -= p.deltaTime * this.dehydrationRate;
    this.hydration = Math.min(Math.max(this.hydration, 0), 1);

    this.updateTimer += this.growthRate * p.deltaTime * this.hydration * 2;

    if (this.updateTimer > this.systemUpdateInterval) {
      this.system.iterate(this.updateTimer);
      this.updateTimer = 0;
    }

    if (this.hydration > 1 - this.dripSeconds * this.dehydrationRate) {
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
    const levels = this.possiblePlacements;
    let i = levels.indexOf(this.placement);
    i = Math.min(i + 1, levels.length - 1);
    this.lastYPlacement = levels[i];
  }

  moveDown() {
    const levels = this.possiblePlacements;
    let i = levels.indexOf(this.placement);
    i = Math.max(i - 1, 0);
    this.lastYPlacement = levels[i];
  }

  get placement() {
    const levels = this.possiblePlacements;

    let closestLevel = levels[0];
    for (const y of levels) {
      if (
        Math.abs(y - this.lastYPlacement) < Math.abs(closestLevel - this.lastYPlacement)
      ) {
        closestLevel = y;
      }
    }

    return closestLevel;
  }

  get possiblePlacements() {
    const { workbench, table, bedShelf, shelves, chair } = furniture;

    const levels = [];

    if (this.x > shelves.x && this.x < shelves.x + shelves.w) {
      levels.push(...shelves.h.map(h => p.height - h));
    } else {
      levels.push(p.height);
    }

    for (const { x, w, h } of [workbench, table, chair, bedShelf]) {
      if (this.x > x && this.x < x + w) {
        levels.push(p.height - h);
      }
    }

    return levels;
  }

  get y() {
    return this.placement;
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
    const flash = p.frame % 10 < 5;

    if (this.highlight) {
      this.system.draw(this.x, this.y - 3, flash ? light : dark);
    } else {
      this.system.draw(this.x, this.y - 3);
    }

    const pot = sprites.pot[this.highlight && flash ? 1 : 0];
    p.sprite(this.x - pot.w / 2, this.y - pot.h, pot);

    for (const [x, y] of this.waterParticles) {
      const c = p.frame % 2 === 0 ? light : dark;
      p.pixel(x, y, c);
    }
  }
}
