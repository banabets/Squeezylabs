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
  { x: -4, z: -12.5, ang: 1.1, hull: '#da8a51', trim: '#467e86', name: 'La Chamita', paint: '#fbf7ee' },
  { x: 36, z: 17, ang: .4, hull: '#2f6f9e', trim: '#f2c14e', name: 'Mi Bendición', paint: '#f2c14e' },
  { x: 5, z: 38, ang: 1.9, hull: '#f2c14e', trim: '#c4312b', name: 'Dios Me Guíe', paint: '#c4312b' },
  { x: -27, z: 4, ang: -.6, hull: '#3e9a95', trim: '#f4f1e8', name: 'Blu de mi corazón', paint: '#fbf7ee' },
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
// Sand height at a world point, matching the terrain meshes (Terrain.tsx): the main island's beach
// dropping into the sea past ring .88, and each cay's gentle dome.
const ringHeight = (x: number, z: number, t: number, dome: number) => {
  const shore = Math.max(0, (t - .88) / .12);
  return .055 + Math.sin(x * 1.6) * Math.sin(z * .8) * .025 * (1 - shore) - Math.pow(shore, 1.5) * 1.05 + dome * (1 - t * t);
};
export function groundHeight(x: number, z: number) {
  let y = ringHeight(x, z, Math.min(mainRing(x, z), 1), 0);
  CAYS.forEach((c, i) => {
    const qx = (x - c.x) / c.rx, qz = (z - c.z) / c.rz, t = Math.hypot(qx, qz) / cayWobble(Math.atan2(qz, qx), i * 1.7);
    if (t < 1) y = Math.max(y, ringHeight(x, z, t, .32));
  });
  return y;
}
