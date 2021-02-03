import { TextAlign } from "pota-8";
import Ship, { ShipState } from "./ship";
import { light, dark } from "./colors";
import Plant, { PlantState } from "./plant";

export default class Gui {
  text: (string | null)[] = [];

  draw() {
    if (this.text) {
      let y = 6;
      for (const line of this.text) {
        if (!line) {
          y += 3;
          continue;
        }

        const w = p.textWidth(line);
        p.rect(p.width / 2 - Math.floor(w / 2) - 1, y - 1, w + 2, 7, dark);
        p.text(line, p.width / 2, y, { color: light, align: TextAlign.Center });
        y += 6;
      }
    }
  }

  showMining(ore: number) {
    this.text = ["mining", `ore: ${ore.toFixed(0)}/1000`];

    if (p.elapsed % 1 < 2 / 3) {
      this.text.push(null, "proximity", "warning");
    }
  }

  showDrivingControls() {
    this.text = ["<z> forward", "<x> reverse", null, "<c> cancel"];
  }

  showShipState(ship: Ship) {
    if (ship.state === ShipState.Accelerating) {
      this.text = ["accelerating"];
    } else if (ship.state === ShipState.Braking) {
      this.text = ["braking"];
    }
  }

  interactConsole() {
    this.text = ["<c> drive"];
  }

  interactBed() {
    this.text = ["<c> rest"];
  }

  interactPlant(plant: Plant) {
    this.text = ["<c> water", "<x> move"];

    switch (plant.state()) {
      case PlantState.Happy:
        this.text = [...this.text, null, "the plant", "looks happy"];
        break;
      case PlantState.Thirsty:
        this.text = [...this.text, null, "the plant", "looks thirsty"];
        break;
      case PlantState.Sickly:
        this.text = [...this.text, null, "the plant", "looks sickly"];
        break;
    }
  }

  holdingPlant() {
    this.text = ["<x> place"];
  }

  collided(ship: Ship) {
    if (p.elapsed % 0.5 < 2 / 6) {
      const hullIntegrity = `${(ship.hullIntegrity * 100).toFixed(0)}%`;
      this.text = ["collision", "detected", null, "hull: " + hullIntegrity];
    } else {
      this.text = [];
    }
  }

  asleep() {
    this.text = ["<c> wake up"];
  }
}
