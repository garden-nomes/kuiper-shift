import { dark, light } from "./colors";
import { drawTurtle, TurtleCommand, TurtleOp } from "./turtle";

// ode to l-systems
// inspired by http://algorithmicbotany.org/papers/modeling-plant-development-with-l-systems.pdf

enum PlantNode {
  Apex = "a",
  Internode = "i",
  Bud = "k",
  Branch = "b"
}

type PlantCommand =
  | TurtleCommand
  | [PlantNode.Apex, number]
  | [PlantNode.Internode, number]
  | [PlantNode.Branch, number];

export default class PlantSystem {
  sequence: PlantCommand[] = [[PlantNode.Apex, 0]];
  age = 0;
  cachedRendering: Uint8Array | null = null;
  cachedRendingBounds: number[] | null = null;

  endBranching = Math.random() * 2 + 4;
  endGrowth = Math.random() * 5 + 2;
  growthRate = 0.01 * Math.random();
  d1 = -Math.random() * 2 - 1;
  d2 = -Math.random() * 2 - 1;
  l1 = Math.random() * 0.5 + 0.25;
  l2 = Math.random() * 0.5 + 0.25;

  iterate(dt: number) {
    const newSequence: PlantCommand[] = [];

    this.age += dt;
    this.ageNodes(dt);

    for (const cmd of this.sequence) {
      if (cmd[0] === PlantNode.Apex && cmd[1] > 0 && this.age < this.endBranching) {
        newSequence.push(
          [PlantNode.Internode, this.l1],
          [TurtleOp.PushState],
          [PlantNode.Branch, 1],
          [PlantNode.Apex, this.d1 * Math.random() + dt],
          [TurtleOp.PopState],
          [TurtleOp.PushState],
          [PlantNode.Branch, -1],
          [PlantNode.Apex, this.d2 * Math.random() + dt],
          [TurtleOp.PopState],
          [PlantNode.Internode, this.l2]
        );
      } else if (cmd[0] === "i" && this.age < this.endGrowth) {
        newSequence.push([PlantNode.Internode, cmd[1] + dt * this.growthRate]);
      } else {
        newSequence.push(cmd);
      }
    }

    this.sequence = newSequence;
    this.updateLines();
  }

  ageNodes(dt: number) {
    this.sequence = this.sequence.map(cmd => {
      if (cmd[0] === PlantNode.Apex) {
        return [PlantNode.Apex, cmd[1] + dt];
      } else {
        return cmd;
      }
    });
  }

  interpret() {
    const interpretation: TurtleCommand[] = [];

    const segments = 5;
    const upwardsTurn = 0.05;
    const branchingAngle = Math.min(this.age / 3, 1) * (1 / 12);
    const internodeLength = Math.min(this.age / 1.5, 1) * 0.5 + 1;

    for (const cmd of this.sequence) {
      if (cmd[0] === PlantNode.Apex) {
        interpretation.push([TurtleOp.SetColor, light], [TurtleOp.Forward, 1]);
      } else if (cmd[0] === PlantNode.Internode) {
        interpretation.push([TurtleOp.SetColor, dark]);
        for (let i = 0; i < segments; i++) {
          interpretation.push(
            [TurtleOp.Forward, (cmd[1] * internodeLength) / segments],
            [TurtleOp.TurnUpwards, upwardsTurn / segments]
          );
        }
      } else if (cmd[0] === PlantNode.Branch) {
        interpretation.push([TurtleOp.Turn, branchingAngle * cmd[1]]);
      } else {
        interpretation.push(cmd);
      }
    }

    return interpretation;
  }

  updateLines() {
    const lines = drawTurtle(this.interpret(), 0, 0);

    for (const line of lines) {
      line[0] = Math.round(line[0]);
      line[1] = Math.round(line[1]);
      line[2] = Math.round(line[2]);
      line[3] = Math.round(line[3]);
    }

    let xMin = Number.POSITIVE_INFINITY,
      xMax = Number.NEGATIVE_INFINITY,
      yMin = Number.POSITIVE_INFINITY,
      yMax = Number.NEGATIVE_INFINITY;

    for (const [x0, y0, x1, y1] of lines) {
      if (x0 < xMin) xMin = x1;
      if (x0 > xMax) xMax = x1;
      if (y0 < yMin) yMin = y1;
      if (y0 > yMax) yMax = y1;
      if (x1 < xMin) xMin = x1;
      if (x1 > xMax) xMax = x1;
      if (y1 < yMin) yMin = y1;
      if (y1 > yMax) yMax = y1;
    }

    const w = Math.ceil(xMax - xMin),
      h = Math.ceil(yMax - yMin);
    this.cachedRendering = new Uint8Array(w * h);

    // draw light colors over dark to give the impression of a leafy top

    for (const [x0, y0, x1, y1, c] of lines) {
      if (c[0] === dark[0]) {
        const i0 = (y0 - yMin) * w + (x0 - xMin);
        const i1 = (y1 - yMin) * w + (x1 - xMin);
        this.cachedRendering[i0] = 1;
        this.cachedRendering[i1] = 1;
      }
    }

    for (const [x0, y0, x1, y1, c] of lines) {
      if (c[0] === light[0]) {
        const i0 = (y0 - yMin) * w + (x0 - xMin);
        const i1 = (y1 - yMin) * w + (x1 - xMin);
        this.cachedRendering[i0] = 2;
        this.cachedRendering[i1] = 2;
      }
    }

    this.cachedRendingBounds = [xMin, yMin, w, h];
  }

  draw(x: number, y: number) {
    if (!this.cachedRendering) return;

    const [x0, y0, w, h] = this.cachedRendingBounds;

    for (let i = 0; i < this.cachedRendering.length; i++) {
      if (this.cachedRendering[i] > 0) {
        const px = x + x0 + (i % w);
        const py = y + y0 + ~~(i / w);
        const c = this.cachedRendering[i] === 1 ? dark : light;
        p.pixel(px, py, c);
      }
    }
  }
}
