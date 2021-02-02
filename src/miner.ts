import { sprites } from "../asset-bundles";

function getYPlacements(x: number) {
  if (x < 12) return 0;
  else if (x < 22) return 5;
  else if (x < 74) return 0;
  else if (x < 83) return 5;
  else return 0;
}

export default class Miner {
  x = 2;
  flip = false;
  walkAnimTimer = 0;
  hasControl = true;
  heldPlant: any = null;

  update() {
    const px = this.x;

    if (this.hasControl) {
      // move the miner
      if (p.keyDown("left")) this.x -= p.deltaTime * 32;
      if (p.keyDown("right")) this.x += p.deltaTime * 32;

      // keep onscreen
      this.x = Math.min(Math.max(this.x, 1), p.width - 2);
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
      this.heldPlant.y = p.height - getYPlacements(this.heldPlant.x);
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
