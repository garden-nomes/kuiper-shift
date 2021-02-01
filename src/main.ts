import { init, TextAlign, VerticalAlign } from "pota-8";
import fontSrc from "../assets/Gizmo199lightfont.png";

const light = [199, 240, 216];
const dark = [67, 82, 61];

init({
  dimensions: [84, 48],
  crop: true,

  font: {
    src: fontSrc,
    w: 5,
    h: 5,
    letters: "!\"# % '()*+,-./0123456789:;<=>?@abcdefghijklmnopqrstuvwxyz"
  },

  setup() {},

  loop() {
    const [bg, text] = p.elapsed % 2 > 1 ? [light, dark] : [dark, light];

    p.clear(bg);

    p.text("nokia 3310 jam", p.width / 2, p.height / 2, {
      color: text,
      align: TextAlign.Center,
      verticalAlign: VerticalAlign.Middle
    });
  }
});
