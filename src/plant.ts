import { sprites } from "../asset-bundles";
import PlantSystem from "./plant-system";

export enum PlantState {
  Happy,
  Thirsty,
  Sickly
}

export default class Plant {
  hydration = 1;
  sickly = 0;
  system = new PlantSystem();
  updateInterval = 1 / 10;
  updateTimer = 0;
  growthRate = 0.05;

  constructor(public x: number) {}

  update() {
    this.hydration -= p.deltaTime * 0.01;
    this.hydration = Math.min(Math.max(this.hydration, 0), 2);

    this.sickly += p.deltaTime * (this.hydration - 1) * 0.1;
    this.sickly = Math.min(Math.max(this.sickly, 0), 1);

    this.updateTimer +=
      this.growthRate * p.deltaTime * Math.min(this.hydration, 1) * (1 - this.sickly);

    if (this.updateTimer > this.updateInterval) {
      this.system.iterate(this.updateTimer);
      this.updateTimer = 0;
    }
  }

  get y() {
    if (this.x < 12) return p.height;
    else if (this.x < 22) return p.height - 5;
    else if (this.x < 74) return p.height;
    else if (this.x < 83) return p.height - 5;
    else return p.height;
  }

  state() {
    if (this.sickly > 0.5) {
      return PlantState.Sickly;
    } else if (this.hydration < 0.5) {
      return PlantState.Thirsty;
    } else {
      return PlantState.Happy;
    }
  }

  water() {
    this.hydration += 1;
  }

  draw() {
    const rect = sprites.pot[0];
    p.sprite(this.x - rect.w / 2, this.y - rect.h, rect);
    this.system.draw(this.x, this.y - 3);
  }
}
