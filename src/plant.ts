import { sprites } from "../asset-bundles";

export enum PlantState {
  Happy,
  Thirsty,
  Sickly
}

export default class Plant {
  growth = 0;
  hydration = 1;
  sickly = 0;

  constructor(public x: number) {}

  update() {
    this.hydration -= p.deltaTime * 0.01;
    this.hydration = Math.min(Math.max(this.hydration, 0), 2);

    this.sickly += p.deltaTime * (this.hydration - 1) * 0.1;
    this.sickly = Math.min(Math.max(this.sickly, 0), 1);

    this.growth += p.deltaTime * 0.01 * Math.min(this.hydration, 1) * (1 - this.sickly);
    this.growth = Math.max(Math.min(this.growth, 1 - 10e-6), 0);
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
    const frames = sprites.plant1.length;
    const frame = ~~(this.growth * frames);
    const rect = sprites.plant1[frame];
    p.sprite(this.x - rect.w / 2, this.y - rect.h, rect);
  }
}
