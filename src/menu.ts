import { TextAlign, VerticalAlign } from "pota-8";
import Ship from "./ship";
import { light, dark } from "./colors";
import MovingNumber from "./moving-number";
import audio from "./audio";

function textWithBackground(
  text: string,
  x: number,
  y: number,
  lightOnDark: boolean,
  align: TextAlign = TextAlign.Left,
  valign: VerticalAlign = VerticalAlign.Top
) {
  const w = p.textWidth(text) + 2;

  if (align === TextAlign.Center) {
    x -= w / 2;
  } else if (align === TextAlign.Right) {
    x -= w;

    if (valign === VerticalAlign.Middle) {
      x -= 3;
    } else if (valign === VerticalAlign.Bottom) {
      x -= 7;
    }
  }

  p.rect(x, y, w, 7, lightOnDark ? dark : light);
  p.text(text, x + 1, y + 1, lightOnDark ? light : dark);

  return w;
}

export interface Resources {
  credits: number;
  ore: number;
  hull: number;
}

export interface Purchases {
  plants: number;
  calendar: boolean;
  screwdriver: boolean;
}

class ResultsScreen {
  onContinue: (result: Resources) => any = () => {};

  private ore: MovingNumber;
  private credits: MovingNumber;
  private hull: MovingNumber;

  private step = 0;
  private stepTimer = 0;

  constructor({ credits, hull, ore }: Resources) {
    this.ore = new MovingNumber(ore, 200);
    this.credits = new MovingNumber(credits, 20);
    this.hull = new MovingNumber(hull, 0.2);
  }

  get isMoving() {
    return this.hull.isMoving || this.ore.isMoving || this.credits.isMoving;
  }

  update() {
    if (!this.isMoving) {
      this.stepTimer += p.deltaTime;
    }

    if (this.step < 3 && this.stepTimer >= 1.5) {
      if (this.step === 0 && (this.hull.value >= 1 || this.ore.value <= 0)) {
        this.step++;
      }

      if (this.step === 1 && this.ore.value <= 0) {
        this.step++;
      }

      switch (this.step) {
        case 0:
          this.repairHull();
          break;
        case 1:
          this.sellOre();
          break;
      }

      this.step++;
      this.stepTimer = 0;
      audio.playOneShot("blip-0");
    }

    this.ore.update();
    this.credits.update();
    this.hull.update();

    if (this.step >= 3 && p.keyPressed("c")) {
      this.onContinue({
        hull: this.hull.value,
        ore: this.ore.value,
        credits: this.credits.value
      });
    }
  }

  repairHull() {
    const hull = this.hull.value;
    const ore = this.ore.value;

    if ((1 - hull) * 1000 >= ore) {
      this.hull.value += ore / 1000;
      this.ore.value = 0;
    } else {
      this.ore.value -= (1 - hull) * 1000;
      this.hull.value = 1;
    }
  }

  sellOre() {
    this.credits.value += this.ore.value / 10;
    this.ore.value = 0;
  }

  draw() {
    const oreText = Math.floor(this.ore.displayValue) + " ore";
    const creditsText = Math.floor(this.credits.displayValue) + "¢";

    const left = 8;
    const right = p.width - 8;

    let top = 8;
    const col = p.width / 4;

    textWithBackground(oreText, left, top, this.ore.isMoving, TextAlign.Left);
    textWithBackground(creditsText, right, top, this.credits.isMoving, TextAlign.Right);

    if (this.step === 1) {
      top += 11;

      const flash = p.elapsed % 1 > 2 / 3;
      if (this.isMoving && !flash) {
        textWithBackground("repairing", p.width / 2, top, false, TextAlign.Center);
        textWithBackground("hull damage", p.width / 2, top + 6, false, TextAlign.Center);
      }

      top += 15;

      const barWidth = (right - left - 2) * this.hull.displayValue;
      p.rect(left, top, right - left, 7, light);
      p.rect(left + 1, top + 1, barWidth, 5, dark);

      const hullText = Math.floor(this.hull.displayValue * 100) + "%";
      textWithBackground(hullText, p.width / 2, top, false, TextAlign.Center);
    } else if (this.step === 2) {
      top += 18;

      if (this.isMoving) {
        const flash = p.elapsed % 0.5 > 1 / 4;
        textWithBackground("transmitting", p.width / 2, top, flash, TextAlign.Center);
      }
    } else if (this.step === 3) {
      if (this.stepTimer % 2 < 4 / 3) {
        textWithBackground(
          "Ⓒ continue",
          p.width / 2,
          p.height / 2,
          true,
          TextAlign.Center,
          VerticalAlign.Middle
        );
      }
    }
  }
}

class StoreScreen {
  onContinue: (credits: number, purchases: Purchases) => any = () => {};

  private credits: MovingNumber;
  private selected = 0;

  private hasCalendar: boolean;
  private hasScrewdriver: boolean;

  private purchases = { plants: 0, calendar: false, screwdriver: false };

  private flashPriceTimer = 0;
  private flashPriceItem = 0;

  constructor({ credits }: Resources, hasCalendar: boolean, hasScrewdriver: boolean) {
    this.credits = new MovingNumber(credits, 100);

    this.hasCalendar = hasCalendar;
    this.hasScrewdriver = hasScrewdriver;
  }

  update() {
    this.credits.update();

    if (this.flashPriceTimer > 0) {
      this.flashPriceTimer -= p.deltaTime;
    }

    if (p.keyPressed("down")) {
      this.moveSelect(true);
    }

    if (p.keyPressed("up")) {
      this.moveSelect(false);
    }

    if (p.keyPressed("c")) {
      switch (this.selected) {
        case 0:
          if (this.tryBuyItem(30, 0)) {
            this.purchases.plants++;
          }
          break;
        case 1:
          if (this.tryBuyItem(80, 1)) {
            this.purchases.calendar = true;
            this.moveSelect(true);
          }
          break;
        case 2:
          if (this.tryBuyItem(100, 2)) {
            this.purchases.screwdriver = true;
            this.moveSelect(true);
          }
          break;
        case 3:
          this.onContinue(this.credits.value, this.purchases);
          break;
      }
    }
  }

  draw() {
    let top = 2;
    const left = 7;
    const right = p.width - 6;

    textWithBackground("buy", left, top, false);

    const creditsText = `${Math.floor(this.credits.displayValue)}¢`;
    const flashCredits = this.flashPriceTimer <= 0 || this.flash();
    textWithBackground(creditsText, right, top, flashCredits, TextAlign.Right);
    top += 10;

    textWithBackground("plant", left, top, this.selected === 0);
    textWithBackground("-30¢", right, top, this.flash(0), TextAlign.Right);
    if (this.selected === 0) this.drawArrow(left, top + 3);
    top += 8;

    if (!this.hasCalendar && !this.purchases.calendar) {
      textWithBackground("calendar", left, top, this.selected === 1);
      textWithBackground("-80¢", right, top, this.flash(1), TextAlign.Right);
      if (this.selected === 1) this.drawArrow(left, top + 3);
    }
    top += 8;

    if (!this.hasScrewdriver && !this.purchases.screwdriver) {
      textWithBackground("screwdriver", left, top, this.selected === 2);
      textWithBackground("-100¢", right, top, this.flash(2), TextAlign.Right);
      if (this.selected === 2) this.drawArrow(left, top + 3);
    }
    top += 10;

    textWithBackground("continue", left, top, this.selected === 3);
    if (this.selected === 3) this.drawArrow(left, top + 3);
    top += 8;
  }

  moveSelect(down: boolean) {
    audio.playOneShot("blip-0");

    do {
      this.selected += down ? 1 : -1;
      this.selected = (this.selected + 4) % 4;
    } while (
      ((this.hasCalendar || this.purchases.calendar) && this.selected === 1) ||
      ((this.hasScrewdriver || this.purchases.screwdriver) && this.selected === 2)
    );
  }

  tryBuyItem(value: number, item: number) {
    if (this.credits.value >= value) {
      this.credits.value -= value;
      audio.playOneShot("blip-0");
      return true;
    } else {
      audio.playOneShot("notice");
      this.flashPriceItem = item;
      this.flashPriceTimer = 0.5;
      return false;
    }
  }

  flash(item?: number) {
    return (
      (typeof item === "undefined" || this.flashPriceItem === item) &&
      this.flashPriceTimer > 0 &&
      this.flashPriceTimer % 0.2 < 0.1
    );
  }

  drawArrow(x: number, y: number) {
    const shift = p.elapsed % 2 > 1 ? 0 : -1;
    p.pixel(x - 2 + shift, y, dark);
    p.pixel(x - 3 + shift, y + 1, dark);
    p.pixel(x - 3 + shift, y - 1, dark);
    p.pixel(x - 3 + shift, y, light);
  }
}

export default class Menu {
  onContinue: (resource: Resources, purchases: Purchases) => any = () => {};

  private screen: ResultsScreen | StoreScreen;

  constructor(
    { credits, ore, hull }: Resources,
    hasCalendar: boolean,
    hasScrewdriver: boolean
  ) {
    this.screen = new ResultsScreen({
      credits: Math.floor(credits),
      ore: Math.floor(ore),
      hull: Math.floor(hull * 100) / 100
    });

    this.screen.onContinue = resources => {
      audio.playOneShot("blip-0");
      this.screen = new StoreScreen(resources, hasCalendar, hasScrewdriver);

      this.screen.onContinue = (credits, purchases) => {
        resources.credits = credits;
        this.onContinue(resources, purchases);
      };
    };
  }

  update() {
    this.screen.update();
  }

  draw() {
    this.screen.draw();
  }
}
