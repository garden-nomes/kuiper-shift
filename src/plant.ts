import { sprites } from "../asset-bundles";
import PlantSystem from "./plant-system";

export enum PlantState {
  Happy,
  Thirsty
}

export default class Plant {
  hydration = 1;
  system = new PlantSystem();
  updateInterval = 1 / 10;
  updateTimer = 0;
  growthRate = 0.05;

  constructor(public x: number) {}

  update() {
    this.hydration -= p.deltaTime * 0.01;
    this.hydration = Math.min(Math.max(this.hydration, 0), 2);

    this.updateTimer += this.growthRate * p.deltaTime * Math.min(this.hydration, 1);

    if (this.updateTimer > this.updateInterval) {
      this.system.iterate(this.updateTimer);
      this.updateTimer = 0;
    }
  }

  get y() {
    if (this.x < 22) return p.height;
    else if (this.x < 32) return p.height - 4;
    else if (this.x < 70) return p.height;
    else if (this.x < 79) return p.height - 5;
    else return p.height;
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
    const rect = sprites.pot[0];
    this.system.draw(this.x, this.y - 3);
    p.sprite(this.x - rect.w / 2, this.y - rect.h, rect);
  }
}
