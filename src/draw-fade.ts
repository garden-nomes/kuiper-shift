import dither from "./dither";

export default function drawFade(
  opacity: number,
  color: number[],
  center: number[] | null = null,
  invert = false
) {
  for (let x = 0; x < p.width; x++) {
    for (let y = 0; y < p.height; y++) {
      let t = opacity;

      if (center !== null) {
        const [cx, cy] = center;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const w = 40;

        if (invert) {
          t = (opacity * (p.width * 2) - dist - w) / w;
        } else {
          t = (dist + w - opacity * (p.width * 2)) / w;
        }
      }

      if (dither(x, y, t)) {
        p.pixel(x, y, color);
      }
    }
  }
}
