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

class ResultsScreen {
  onContinue: (results: { hull: number; ore: number; credits: number }) => any = () => {};

  private ore: MovingNumber;
  private credits: MovingNumber;
  private hull: MovingNumber;

  private repairCost = 0;
  private sellValue = 0;

  private step = 0;
  private stepTimer = 0;

  constructor(ship: Ship) {
    this.ore = new MovingNumber(ship.ore, 1000);
    this.credits = new MovingNumber(ship.credits, 100);
    this.hull = new MovingNumber(ship.hullIntegrity, 1);

    this.repairCost = Math.min((1 - this.hull.value) * 1000, this.ore.value);
    this.sellValue = (this.ore.value - this.repairCost) / 10;
  }

  update() {
    const isMoving = this.hull.isMoving || this.ore.isMoving || this.credits.isMoving;

    if (!isMoving) {
      this.stepTimer += p.deltaTime;
    }

    if (this.step < 3 && this.stepTimer >= 1) {
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
      this.repairCost = this.ore.value;
      this.hull.value += ore / 1000;
      this.ore.value = 0;
    } else {
      this.repairCost = (1 - hull) * 1000;
      this.ore.value -= (1 - hull) * 1000;
      this.hull.value = 1;
    }
  }

  sellOre() {
    this.credits.value += this.ore.value / 10;
    this.ore.value = 0;
  }

  draw() {
    const hullText = Math.floor(this.hull.displayValue * 100) + "%";
    const oreText = Math.floor(this.ore.displayValue) + "";
    const creditsText = Math.floor(this.credits.displayValue) + "";

    const left = 6;
    const right = p.width - 6;

    let top = 2;
    const col = p.width / 4;
    textWithBackground("hull", left, top, false);
    textWithBackground(hullText, left, top + 7, true);

    textWithBackground("¢", p.width / 2, top, false, TextAlign.Center);
    textWithBackground(creditsText, p.width / 2, top + 7, true, TextAlign.Center);

    textWithBackground("ore", right, top, false, TextAlign.Right);
    textWithBackground(oreText, right, top + 7, true, TextAlign.Right);

    if (this.step < 1) return;

    top += 15;
    const repairCost = `-${Math.floor(this.repairCost)} ore`;
    textWithBackground("hull", left, top, false);
    textWithBackground("repairs", left, top + 6, false);
    textWithBackground(repairCost, right, top + 6, false, TextAlign.Right);

    if (this.step < 2) return;

    top += 14;
    const sellValue = `+${Math.floor(this.sellValue)}¢`;
    left + textWithBackground("ore value", left, top, false);
    right - textWithBackground(sellValue, right, top, false, TextAlign.Right);

    if (this.step < 3) return;

    if (this.stepTimer % 2 < 4 / 3) {
      top += 8;
      textWithBackground("Ⓒ continue", p.width / 2, top, true, TextAlign.Center);
    }
  }
}

class StoreScreen {
  onContinue: (
    credits: number,
    purchases: { plants: number; calendar: boolean; screwdriver: boolean }
  ) => any = () => {};

  private credits: MovingNumber;
  private selected = 0;

  private hasCalendar: boolean;
  private hasScredriver: boolean;

  private purchases = { plants: 0, calendar: false, screwdriver: false };

  private flashPriceTimer = 0;
  private flashPriceItem = 0;

  constructor(ship: Ship) {
    this.credits = new MovingNumber(ship.credits, 100);

    this.hasCalendar = false;
    this.hasScredriver = false;
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

    if (!this.hasScredriver && !this.purchases.screwdriver) {
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
    do {
      this.selected += down ? 1 : -1;
      this.selected = (this.selected + 4) % 4;
    } while (
      ((this.hasCalendar || this.purchases.calendar) && this.selected === 1) ||
      ((this.hasScredriver || this.purchases.screwdriver) && this.selected === 2)
    );
  }

  tryBuyItem(value: number, item: number) {
    if (this.credits.value >= value) {
      this.credits.value -= value;
      audio.playOneShot("blip-1");
      return true;
    } else {
      audio.playOneShot("blip-0");
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
  onContinue: () => any = () => {};
  onBuyPlant: () => any = () => {};

  private screen: ResultsScreen | StoreScreen;

  constructor(private ship: Ship) {
    this.screen = new ResultsScreen(ship);

    this.screen.onContinue = ({ credits, hull, ore }) => {
      ship.credits = credits;
      ship.hullIntegrity = hull;
      ship.ore = ore;

      this.screen = new StoreScreen(ship);
      this.screen.onContinue = (credits, { plants }) => {
        ship.credits = credits;
        for (let i = 0; i < plants; i++) this.onBuyPlant();
        this.onContinue();
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
