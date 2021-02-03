import { TextAlign } from "pota-8";
import Ship from "./ship";
import { light, dark } from "./colors";

export enum MenuOption {
  Repair,
  SellOre,
  BuyPlant,
  Continue
}

export default class Menu {
  selected = MenuOption.Repair;
  oreToCredits = 0.1;
  totalHullRepairCost = 1000;
  plantCost = 50;
  onBuyPlant: () => any = () => {};
  onContinue: () => any = () => {};

  constructor(public ship: Ship) {}

  reset() {
    this.selected = MenuOption.Repair;

    // ward off the rounding errors
    this.ship.ore = Math.round(this.ship.ore);
    this.ship.credits = Math.round(this.ship.credits);
    this.ship.hullIntegrity = Math.round(this.ship.hullIntegrity * 100) / 100;
  }

  loop() {
    while (this.isDisabled(this.selected)) {
      this.selected = (this.selected + 1 + 4) % 4;
    }

    if (p.keyPressed("down")) {
      this.selected = (this.selected + 1) % 4;
      while (this.isDisabled(this.selected)) {
        this.selected = (this.selected + 1) % 4;
      }
    }

    if (p.keyPressed("up")) {
      this.selected = (this.selected - 1 + 4) % 4;
      while (this.isDisabled(this.selected)) {
        this.selected = (this.selected - 1 + 4) % 4;
      }
    }

    if (p.keyPressed("c")) {
      switch (this.selected) {
        case MenuOption.Repair:
          this.repair();
          break;
        case MenuOption.SellOre:
          this.sellOre();
          break;
        case MenuOption.BuyPlant:
          this.buyPlant();
          break;
        case MenuOption.Continue:
          this.continue();
          break;
      }
    }

    const hull = Math.floor(this.ship.hullIntegrity * 100);
    const ore = Math.floor(this.ship.ore);
    const credits = this.ship.credits;
    const sellPrice = this.ship.ore * this.oreToCredits;

    p.text(`hull: ${hull.toFixed(0)}%`, p.width / 2, 2, {
      color: dark,
      align: TextAlign.Center
    });

    p.text(`${ore.toFixed(0)} ore / ${credits.toFixed(0)}¢`, p.width / 2, 10, {
      color: dark,
      align: TextAlign.Center
    });

    this.drawMenuItem("repair", 20, MenuOption.Repair, -this.repairCost(), " ore");
    this.drawMenuItem("sell ore", 27, MenuOption.SellOre, sellPrice, "¢");
    this.drawMenuItem("buy plant", 34, MenuOption.BuyPlant, -this.plantCost, "¢");
    this.drawMenuItem("continue", 41, MenuOption.Continue);
  }

  private repairCost() {
    return Math.min(
      (1 - this.ship.hullIntegrity) * this.totalHullRepairCost,
      this.ship.ore
    );
  }

  private drawMenuItem(
    text: string,
    y: number,
    id: MenuOption,
    cost?: number,
    units?: string
  ) {
    if (this.isDisabled(id)) return;

    if (this.selected === id) {
      const w = p.textWidth(text);
      p.rect(4, y - 1, w + 2, 7, dark);
      p.text(text, 5, y, { color: light });

      p.pixel(2, y + 2, dark);
      p.pixel(1, y + 1, dark);
      p.pixel(1, y + 3, dark);
    } else {
      p.text(text, 5, y, { color: dark });
    }

    if (cost && cost !== 0) {
      p.text(`${cost > 0 ? "+" : ""}${cost.toFixed(0)}${units || ""}`, p.width - 2, y, {
        color: dark,
        align: TextAlign.Right
      });
    }
  }

  private isDisabled(option: MenuOption) {
    switch (option) {
      case MenuOption.Repair:
        return this.repairCost() <= 0;
      case MenuOption.SellOre:
        return this.ship.ore <= 0;
      case MenuOption.BuyPlant:
        return this.ship.credits < this.plantCost;
      default:
        return false;
    }
  }

  private repair() {
    const cost = this.repairCost();
    this.ship.ore -= cost;
    this.ship.hullIntegrity += cost / this.totalHullRepairCost;
  }

  private sellOre() {
    this.ship.credits += this.ship.ore * this.oreToCredits;
    this.ship.ore = 0;
  }

  private buyPlant() {
    this.ship.credits -= this.plantCost;
  }

  private continue() {
    this.onContinue();
  }
}
