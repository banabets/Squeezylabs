// Archipelago layout shared by terrain, water shader and props.
// The main island is an ellipse centered on (0, 8) with different radii per side; the east side is wider to fit the village.
export const MAIN = { cz: 8, rxW: 22, rxE: 30, rzN: 17, rzS: 27 };
export type Cay = { x: number; z: number; rx: number; rz: number };
export const CAYS: Cay[] = [
  { x: 44, z: -2, rx: 6, rz: 4.2 },
  { x: -34, z: 20, rx: 5.5, rz: 3.8 },
  { x: 16, z: 44, rx: 4.6, rz: 3.2 },
  { x: -16, z: -22, rx: 4, rz: 3 },
];
// Shallow sandbars from the main island to two cays: [x1, z1, x2, z2].
export const SANDBARS: [number, number, number, number][] = [[27, 5, 38, -1], [-19, 15, -29, 19]];
export const BOATS = [
  { x: -4, z: -12.5, ang: 1.1, hull: '#da8a51', trim: '#467e86' },
  { x: 36, z: 17, ang: .4, hull: '#2f6f9e', trim: '#f2c14e' },
  { x: 5, z: 38, ang: 1.9, hull: '#f2c14e', trim: '#c4312b' },
  { x: -27, z: 4, ang: -.6, hull: '#3e9a95', trim: '#f4f1e8' },
];
const wobble = (a: number) => 1 + Math.sin(a * 3 + .4) * .04 + Math.sin(a * 7) * .023;
// Point on the main island at angle a and ring t (1 = outer terrain ring, the waterline sits near .94).
export function mainPoint(a: number, t: number): [number, number] {
  const c = Math.cos(a), s = Math.sin(a), v = wobble(a) * t;
  return [c * (c < 0 ? MAIN.rxW : MAIN.rxE) * v, MAIN.cz + s * (s < 0 ? MAIN.rzN : MAIN.rzS) * v];
}
// Ring value of a world point on the main island (inverse of mainPoint).
export function mainRing(x: number, z: number) {
  const qx = x / (x < 0 ? MAIN.rxW : MAIN.rxE), qz = (z - MAIN.cz) / (z < MAIN.cz ? MAIN.rzN : MAIN.rzS);
  return Math.hypot(qx, qz) / wobble(Math.atan2(qz, qx));
}
export const cayWobble = (a: number, seed: number) => 1 + Math.sin(a * 3 + seed) * .05 + Math.sin(a * 5 + seed * 2) * .03;
