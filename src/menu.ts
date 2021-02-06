import { TextAlign } from "pota-8";
import Ship from "./ship";
import { light, dark } from "./colors";
import audio from "./audio";

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
  plantCost = 30;
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

  draw() {
    const hull = Math.floor(this.ship.hullIntegrity * 100);
    const ore = Math.floor(this.ship.ore);
    const credits = this.ship.credits;
    const sellPrice = this.ship.ore * this.oreToCredits;

    const hullText = `hull: ${hull.toFixed(0)}%`;
    let w = p.textWidth(hullText);
    p.rect(p.width / 2 - w / 2 - 0.5, 1, w + 2, 7, light);
    p.text(hullText, p.width / 2, 2, {
      color: dark,
      align: TextAlign.Center
    });

    const resourcesText = `${ore.toFixed(0)} ore / ${credits.toFixed(0)}¢`;
    w = p.textWidth(resourcesText);
    p.rect(p.width / 2 - w / 2 - 0.5, 9, w + 2, 7, light);
    p.text(resourcesText, p.width / 2, 10, {
      color: dark,
      align: TextAlign.Center
    });

    this.drawMenuItem("repair", 20, MenuOption.Repair, -this.repairCost(), " ore");
    this.drawMenuItem("sell ore", 27, MenuOption.SellOre, sellPrice, "¢");
    this.drawMenuItem("buy plant", 34, MenuOption.BuyPlant, -this.plantCost, "¢");
    this.drawMenuItem("continue", 41, MenuOption.Continue);
  }

  update() {
    while (this.isDisabled(this.selected)) {
      this.selected = (this.selected + 1 + 4) % 4;
    }

    const previous = this.selected;

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

    if (this.selected !== previous) {
      audio.playOneShot("blip-3");
    }

    if (p.keyPressed("c")) {
      switch (this.selected) {
        case MenuOption.Repair:
          this.repair();
          audio.playOneShot("blip-0");
          break;
        case MenuOption.SellOre:
          this.sellOre();
          audio.playOneShot("blip-0");
          break;
        case MenuOption.BuyPlant:
          this.buyPlant();
          audio.playOneShot("blip-0");
          break;
        case MenuOption.Continue:
          this.continue();
          break;
      }
    }
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

    const isSelected = this.selected === id;
    const w = p.textWidth(text);
    p.rect(4, y - 1, w + 2, 7, isSelected ? dark : light);
    p.text(text, 5, y, { color: isSelected ? light : dark });

    if (isSelected) {
      p.pixel(2, y + 2, dark);
      p.pixel(1, y + 1, dark);
      p.pixel(1, y + 3, dark);
    }

    if (cost && cost !== 0) {
      const costText = `${cost > 0 ? "+" : ""}${cost.toFixed(0)}${units || ""}`;
      const w = p.textWidth(costText);
      p.rect(p.width - 2 - w - 2, y - 1, w + 2, 7, light);
      p.text(costText, p.width - 2, y, { color: dark, align: TextAlign.Right });
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
    this.onBuyPlant();
  }

  private continue() {
    this.onContinue();
  }
}
