import { dark, light } from "./colors";
import Ship from "./ship";

export default function drawHud(ship: Ship, proximity: number | null, isMining: boolean) {
  // speed bar
  const speedBarHeight = Math.min(Math.log(ship.speed + 1) * 16, 26);

  if (speedBarHeight > 0) {
    p.line(3, 35, 3, 35 - speedBarHeight, light);
  }

  // proximity meter
  if (proximity !== null && proximity < 10) {
    const proximityHeight = Math.min(Math.log(proximity + 1) * 16 - 1, 23);
    const flashing = proximity < ship.miningDistance;

    p.line(
      p.width - 4,
      31,
      p.width - 4,
      31 - proximityHeight,
      flashing && p.frame % 2 === 0 ? dark : light
    );
  }

  // proximity meter tick mark for mining distance
  const tickHeight = Math.log(ship.miningDistance + 1) * 16 - 1;
  p.line(p.width - 7, 31 - tickHeight, p.width - 6, 31 - tickHeight, light);

  const [cx, cy] = [p.width / 2, p.height / 2];

  if (isMining) {
    // mining lasers
    p.line(0, p.height, cx, cy, light);
    p.line(0, p.height - 1, cx, cy - 1, dark);
    p.line(p.width, p.height, cx, cy, light);
    p.line(p.width, p.height - 1, cx, cy - 1, dark);
  }

  // reticle
  const c = proximity !== null && proximity < 10 ? dark : light;
  p.line(cx - 1, cy - 1, cx + 1, cy - 1, c);
  p.line(cx, cy - 2, cx, cy, c);
}
