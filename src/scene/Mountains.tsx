import { useMemo } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute, MeshStandardMaterial } from 'three';

// The Cordillera de la Costa on the horizon: long green ridges that fall into the sea, hazed by the
// scene fog so they read as distant, like the mountains behind Choroní or Puerto Colombia.
const n = (x: number) => { const s = Math.sin(x * 12.9898) * 43758.5453; return s - Math.floor(s); };
const smooth = (x: number) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return n(i) * (1 - u) + n(i + 1) * u; };
function ridge(a0: number, a1: number, radius: number, height: number, seed: number) {
  const cols = 220, rows = 6, pos: number[] = [], col: number[] = [], idx: number[] = [];
  const green = new Color('#4d7148'), rock = new Color('#7d8a6e'), foot = new Color('#3f6340');
  for (let i = 0; i <= cols; i++) {
    const t = i / cols, a = a0 + (a1 - a0) * t;
    // Peaks taper at both ends so each range rises out of and sinks back into the sea.
    const env = Math.pow(Math.sin(Math.PI * t), .6);
    const h = height * env * (.55 + .3 * smooth(t * 7 + seed) + .15 * smooth(t * 23 + seed * 3) + .06 * smooth(t * 61 + seed));
    for (let j = 0; j <= rows; j++) {
      const v = j / rows, r = radius - v * height * .9, y = -3 + (h + 3) * Math.pow(v, .85);
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
      const c = foot.clone().lerp(green, Math.min(1, v * 1.6)).lerp(rock, Math.max(0, v - .8) * 2);
      col.push(c.r, c.g, c.b);
      if (i < cols && j < rows) { const k = i * (rows + 1) + j; idx.push(k, k + 1, k + rows + 1, k + 1, k + rows + 2, k + rows + 1); }
    }
  }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('color', new Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
export function Mountains() {
  const { geos, material } = useMemo(() => ({
    geos: [ridge(-2.75, -.95, 250, 46, 1), ridge(-1.15, -.35, 290, 34, 7), ridge(-.25, .55, 270, 22, 13)],
    material: new MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  }), []);
  return <>{geos.map((g, i) => <mesh key={i} geometry={g} material={material} raycast={() => {}} />)}</>;
}
