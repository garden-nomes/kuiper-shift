import { Color } from "pota-8/dist/renderer";
import { dark } from "./colors";

export enum TurtleOp {
  Forward = "f",
  Move = "m",
  Turn = "t",
  TurnUpwards = "tu",
  PushState = "pu",
  PopState = "po",
  SetColor = "c"
}

export type TurtleCommand =
  | [TurtleOp.Forward, number]
  | [TurtleOp.Move, number]
  | [TurtleOp.Turn, number]
  | [TurtleOp.TurnUpwards, number]
  | [TurtleOp.PushState]
  | [TurtleOp.PopState]
  | [TurtleOp.SetColor, Color];

export function drawTurtle(
  sequence: TurtleCommand[],
  x: number,
  y: number,
  s: number = 1
) {
  let color = dark;
  let dir = -Math.PI / 2;
  const stack: number[][] = [];
  const lines: [number, number, number, number, Color][] = [];

  for (const cmd of sequence) {
    if (cmd[0] === TurtleOp.Forward) {
      const d = cmd[1];
      const [nx, ny] = [x + Math.cos(dir) * d * s, y + Math.sin(dir) * d * s];
      lines.push([x, y, nx, ny, color]);
      [x, y] = [nx, ny];
    } else if (cmd[0] === TurtleOp.Move) {
      const d = cmd[1];
      [x, y] = [x + Math.cos(dir) * d * s, y + Math.sin(dir) * d * s];
    } else if (cmd[0] === TurtleOp.Turn) {
      dir -= Math.PI * 2 * cmd[1];
    } else if (cmd[0] === TurtleOp.TurnUpwards) {
      dir -= Math.PI * 2 * cmd[1] * (Math.cos(dir) > 0 ? 1 : -1);
    } else if (cmd[0] === TurtleOp.PushState) {
      stack.push([x, y, dir]);
    } else if (cmd[0] === TurtleOp.PopState) {
      if (stack.length === 0) {
        throw new Error("No pushed state to retreive");
      }

      [x, y, dir] = stack.pop();
    } else if (cmd[0] === TurtleOp.SetColor) {
      color = cmd[1];
    }
  }

  return lines;
}
