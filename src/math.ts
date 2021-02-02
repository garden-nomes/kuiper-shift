function dot(v0: number[], v1: number[]) {
  return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
}

export function sub([x0, y0, z0]: number[], [x1, y1, z1]: number[]) {
  return [x0 - x1, y0 - y1, z0 - z1];
}

export function magSq([x, y, z]: number[]) {
  return x * x + y * y + z * z;
}

export function mag([x, y, z]: number[]) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function normalize([x, y, z]: number[]) {
  const d = Math.sqrt(x * x + y * y + z * z);
  if (d === 0) return [0, 0, 1];
  return [x / d, y / d, z / d];
}

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

export function addVec(v0: number[], v1: number[]) {
  return [v0[0] + v1[0], v0[1] + v1[1], v0[2] + v1[2]];
}

export function scaleVec(v: number[], s: number) {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function rollMatrix(yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1]
  ];
}

export function yawMatrix(yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c]
  ];
}

export function pitchMatrix(yaw: number) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);

  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c]
  ];
}

export function viewMatrix(pos: number[], rot: number[][]) {
  return [
    [rot[0][0], rot[1][0], rot[2][0], 0],
    [rot[0][1], rot[1][1], rot[2][1], 0],
    [rot[0][2], rot[1][2], rot[2][2], 0],
    [-dot(rot[0], pos), -dot(rot[1], pos), -dot(rot[2], pos), 1]
  ];
}

export function projectToScreen(viewMatrix: number[][], x: number, y: number, z: number) {
  [x, y, z] = [
    viewMatrix[0][0] * x + viewMatrix[1][0] * y + viewMatrix[2][0] * z + viewMatrix[3][0],
    viewMatrix[0][1] * x + viewMatrix[1][1] * y + viewMatrix[2][1] * z + viewMatrix[3][1],
    viewMatrix[0][2] * x + viewMatrix[1][2] * y + viewMatrix[2][2] * z + viewMatrix[3][2]
  ];

  const s = p.width / 2;
  return [(x * s) / z + p.width / 2, (y * -s) / z + p.height / 2, z];
}
