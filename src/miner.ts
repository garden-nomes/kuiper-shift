import { sprites } from "../asset-bundles";
import Plant from "./plant";

function minAbs(a: number, b: number) {
  Math.abs(a) < Math.abs(b) ? a : b;
}

export default class Miner {
  x = 2;
  flip = false;
  walkAnimTimer = 0;
  hasControl = true;
  heldPlant: Plant | null = null;
  wateringPlant: Plant | null = null;
  moveRightOverride = false;
  waterRate = 1;

  update() {
    const px = this.x;

    if (this.wateringPlant) {
      // proceed towards the designated watering position
      const targetX =
        this.x < this.wateringPlant.x
          ? ~~this.wateringPlant.x - 5
          : ~~this.wateringPlant.x + 4;

      if (Math.abs(this.x - targetX) < 10e-5) {
        this.x = targetX;
        this.flip = this.wateringPlant.x < this.x;
        this.wateringPlant.hydration += p.deltaTime * this.waterRate;
      } else {
        const toTarget = targetX - this.x;
        const maxMovement = p.deltaTime * 32 * (toTarget < 0 ? -1 : 1);
        this.x += Math.abs(maxMovement) < Math.abs(toTarget) ? maxMovement : toTarget;
      }
    } else if (this.hasControl && !this.wateringPlant) {
      // move the miner
      if (p.keyDown("left")) this.x -= p.deltaTime * 32;
      if (p.keyDown("right")) this.x += p.deltaTime * 32;

      // keep onscreen
      this.x = Math.min(Math.max(this.x, 1), p.width - 2);
    }

    if (this.moveRightOverride) {
      this.x += p.deltaTime * 32;
    }

    // update animation state
    if (px !== this.x) {
      if (this.x - px < 0) this.flip = true;
      if (this.x - px > 0) this.flip = false;
      this.walkAnimTimer += p.deltaTime;
    } else {
      this.walkAnimTimer = 0;
    }

    // move held plant
    if (this.heldPlant) {
      this.heldPlant.x = this.flip ? this.x - 3 : this.x + 4;
      this.heldPlant.x = Math.min(Math.max(this.heldPlant.x, 2), p.width - 2);

      if (p.keyPressed("up")) {
        this.heldPlant.moveUp();
      }

      if (p.keyPressed("down")) {
        this.heldPlant.moveDown();
      }
    }
  }

  draw() {
    const frame =
      this.walkAnimTimer > 0
        ? (Math.floor(this.walkAnimTimer * 8) % (sprites.miner.length - 1)) + 1
        : 0;

    const s = sprites.miner[frame];
    p.sprite(this.x - s.w / 2, p.height - s.h, s, { flipX: this.flip });
  }
}
