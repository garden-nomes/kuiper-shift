export namespace Vec3 {
  export function dot(v0: number[], v1: number[]) {
    return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
  }

  export function add(v0: number[], v1: number[]) {
    return [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]];
  }

  export function sub(v0: number[], v1: number[]) {
    return [v0[0] - v1[0], v0[1] - v1[1], v0[2] - v1[2]];
  }

  export function magSq(v: number[]) {
    return v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  }

  export function mag(v: number[]) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  }

  export function scale(v: number[], s: number) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }

  export function normalize(v: number[]) {
    const d = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (d === 0) return [0, 0, 1];
    return [v[0] / d, v[1] / d, v[2] / d];
  }
}

export namespace Matrix {
  export function mult3x3(m0: number[][], m1: number[][]) {
    return [
      [
        m0[0][0] * m1[0][0] + m0[0][1] * m1[1][0] + m0[0][2] * m1[2][0],
        m0[0][0] * m1[0][1] + m0[0][1] * m1[1][1] + m0[0][2] * m1[2][1],
        m0[0][0] * m1[0][2] + m0[0][1] * m1[1][2] + m0[0][2] * m1[2][2]
      ],
      [
        m0[1][0] * m1[0][0] + m0[1][1] * m1[1][0] + m0[1][2] * m1[2][0],
        m0[1][0] * m1[0][1] + m0[1][1] * m1[1][1] + m0[1][2] * m1[2][1],
        m0[1][0] * m1[0][2] + m0[1][1] * m1[1][2] + m0[1][2] * m1[2][2]
      ],
      [
        m0[2][0] * m1[0][0] + m0[2][1] * m1[1][0] + m0[2][2] * m1[2][0],
        m0[2][0] * m1[0][1] + m0[2][1] * m1[1][1] + m0[2][2] * m1[2][1],
        m0[2][0] * m1[0][2] + m0[2][1] * m1[1][2] + m0[2][2] * m1[2][2]
      ]
    ];
  }

  export function mult3x3vec(m: number[][], v: number[]) {
    return [
      m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
      m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
      m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2]
    ];
  }

  export function roll(yaw: number) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);

    return [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1]
    ];
  }

  export function yaw(yaw: number) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);

    return [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c]
    ];
  }

  export function pitch(yaw: number) {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);

    return [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c]
    ];
  }
}

export function raycastSphere(
  rayOrigin: number[],
  rayDirection: number[],
  sphereCenter: number[],
  sphereRadius: number
): number | null {
  // http://kylehalladay.com/blog/tutorial/math/2013/12/24/Ray-Sphere-Intersection.html

  const toSphere = Vec3.sub(sphereCenter, rayOrigin);
  const tc = Vec3.dot(toSphere, rayDirection);

  if (tc < 0) {
    return null;
  }

  const d = Math.sqrt(Vec3.magSq(toSphere) - tc * tc);

  if (d > sphereRadius) {
    return null;
  }

  const t1c = Math.sqrt(sphereRadius * sphereRadius - d * d);

  return tc - t1c;
}

export class Projection {
  m: number[][];

  constructor(pos: number[], rot: number[][], private s: number) {
    this.m = [
      [rot[0][0], rot[1][0], rot[2][0], 0],
      [rot[0][1], rot[1][1], rot[2][1], 0],
      [rot[0][2], rot[1][2], rot[2][2], 0],
      [-Vec3.dot(rot[0], pos), -Vec3.dot(rot[1], pos), -Vec3.dot(rot[2], pos), 1]
    ];
  }

  projectToScreen(v: number[]) {
    const x =
      this.m[0][0] * v[0] + this.m[1][0] * v[1] + this.m[2][0] * v[2] + this.m[3][0];
    const y =
      this.m[0][1] * v[0] + this.m[1][1] * v[1] + this.m[2][1] * v[2] + this.m[3][1];
    const z =
      this.m[0][2] * v[0] + this.m[1][2] * v[1] + this.m[2][2] * v[2] + this.m[3][2];

    return [(x * this.s) / z + p.width / 2, (y * -this.s) / z + p.height / 2, z / this.s];
  }
}
