import { sprites } from "../asset-bundles";

export default class Miner {
  x = 2;
  flip = false;
  walkAnimTimer = 0;
  hasControl = true;

  update() {
    const px = this.x;

    if (this.hasControl) {
      // move the miner
      if (p.keyDown("left")) this.x -= p.deltaTime * 32;
      if (p.keyDown("right")) this.x += p.deltaTime * 32;

      // keep onscreen
      this.x = Math.min(Math.max(this.x, 0), p.width - 8);
    }

    // update animation state
    if (px !== this.x) {
      if (this.x - px < 0) this.flip = true;
      if (this.x - px > 0) this.flip = false;
      this.walkAnimTimer += p.deltaTime;
    } else {
      this.walkAnimTimer = 0;
    }
  }

  draw() {
    const frame =
      this.walkAnimTimer > 0
        ? (Math.floor(this.walkAnimTimer * 8) % (sprites.miner.length - 1)) + 1
        : 0;

    p.sprite(this.x, p.height - 8, sprites.miner[frame], { flipX: this.flip });
  }
}
