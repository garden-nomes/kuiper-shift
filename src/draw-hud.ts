import { dark, light } from "./colors";
import Ship from "./ship";

export default function drawHud(ship: Ship, proximity: number | null, isMining: boolean) {
  // speed bar
  const speedBarHeight = Math.min(Math.log(ship.speed + 1) * 16, 28);
  p.line(3, p.height - 11, 3, p.height - 11 - speedBarHeight, light);

  // proximity meter
  if (proximity !== null) {
    const proximityHeight = Math.min(Math.log(proximity + 1) * 16 - 1, 28);
    const flashing = proximity < ship.miningDistance;

    p.line(
      p.width - 4,
      p.height - 11,
      p.width - 4,
      p.height - 11 - proximityHeight,
      flashing && p.frame % 2 === 0 ? dark : light
    );
  }

  // proximity meter tick mark for mining distance
  const tickHeight = Math.min(Math.log(ship.miningDistance + 1) * 16 - 1, 28);
  p.line(
    p.width - 7,
    p.height - 11 - tickHeight,
    p.width - 6,
    p.height - 11 - tickHeight,
    light
  );

  const [cx, cy] = [p.width / 2, p.height / 2];

  // reticle
  const c = proximity === null ? light : p.frame % 2 === 0 ? light : dark;
  p.line(cx - 1, cy - 1, cx + 1, cy - 1, c);
  p.line(cx, cy - 2, cx, cy, c);

  if (isMining) {
    // mining lasers
    p.line(0, p.height, cx, cy, light);
    p.line(0, p.height - 1, cx, cy - 1, dark);
    p.line(p.width, p.height, cx, cy, light);
    p.line(p.width, p.height - 1, cx, cy - 1, dark);
  }
}
