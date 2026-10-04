import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Matrix4, MeshDepthMaterial, MeshStandardMaterial, Quaternion, RGBADepthPacking, SphereGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { journey } from '../data/journey';
import { leafGeometry, rng } from './Mango';
import { applyPbr, broadTexture, frondTexture } from './realism';
import { addWind } from './wind';

// Realistic coconut palms and leafy shrubs. The file keeps its old name and exports so every caller
// (garden, pots, roofs, cays) picks up the new look without changes.
type V = [number, number, number];
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const noRaycast = () => {};

// ---------- Coconut palm ----------
const HEIGHT = 5.6, BEND = .5;
let palmMats: { bark: MeshStandardMaterial; roots: MeshStandardMaterial; frond: MeshStandardMaterial; frondDepth: MeshDepthMaterial; nut: MeshStandardMaterial } | null = null;
function palmMaterials() {
  if (palmMats) return palmMats;
  const wind = { base: 3, amp: .006, flutter: .01 };
  palmMats = {
    bark: applyPbr(new MeshStandardMaterial({ color: '#d8c8b0' }), 'palm_bark', { normalScale: 1.2 }),
    frond: addWind(new MeshStandardMaterial({ map: frondTexture(), alphaTest: .45, side: DoubleSide, vertexColors: true, roughness: .55 }), wind),
    frondDepth: addWind(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: frondTexture(), alphaTest: .45, side: DoubleSide }), wind),
    nut: new MeshStandardMaterial({ color: '#7a6a2c', roughness: .5 }),
    roots: new MeshStandardMaterial({ color: '#57483c', roughness: .95 }),
  };
  return palmMats;
}

// Ringed trunk that curves toward +x, flares at the base and narrows under the crown.
function trunkGeometry() {
  // Two extra rings continue the flared base half a meter underground, so the trunk stays planted
  // wherever the beach sits a little lower than the palm's origin.
  const rings = 28, seg = 14, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const ts = [-.09, -.03, ...Array.from({ length: rings + 1 }, (_, j) => j / rings)];
  for (const t of ts) {
    const u = Math.max(t, 0), cx = BEND * u * u, cy = t * HEIGHT, r = (.25 - .09 * u + .16 * Math.exp(-u * 14)) * (1 + Math.sin(u * 61) * .015) * (t < 0 ? 1.04 : 1);
    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; pos.push(cx + Math.cos(a) * r, cy, Math.sin(a) * r); uv.push(i / seg * 2, t * HEIGHT / 1.1); }
  }
  for (let j = 0; j < ts.length - 1; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// Coconut palms grow a mat of thick, fibrous roots that bulge out of the sand around the trunk.
function rootGeometry() {
  const parts: BufferGeometry[] = [], up = new Vector3(0, 1, 0);
  for (let k = 0; k < 30; k++) {
    const a = k / 30 * Math.PI * 2 + rnd(k) * .25, reach = .44 + rnd(k + 9) * .16, thick = .024 + rnd(k + 4) * .02;
    const from = new Vector3(Math.cos(a) * .33, .02 + rnd(k + 2) * .06, Math.sin(a) * .33), to = new Vector3(Math.cos(a) * reach, -.32, Math.sin(a) * reach);
    const dir = to.clone().sub(from), len = dir.length();
    const c = new CylinderGeometry(thick * .45, thick, len, 6, 1); c.translate(0, len / 2, 0);
    c.applyMatrix4(new Matrix4().makeRotationFromQuaternion(new Quaternion().setFromUnitVectors(up, dir.normalize())));
    c.translate(from.x, from.y, from.z);
    parts.push(c.index ? c.toNonIndexed() : c);
  }
  // A low knobbly collar where the roots meet the trunk.
  const collar = new SphereGeometry(.46, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2); collar.scale(1, .3, 1);
  const p = collar.attributes.position; for (let i = 0; i < p.count; i++) { const f = 1 + (rnd(i * 3.1) - .5) * .12; p.setXYZ(i, p.getX(i) * f, p.getY(i), p.getZ(i) * f); }
  collar.computeVertexNormals(); parts.push(collar.index ? collar.toNonIndexed() : collar);
  for (const g of parts) for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
  return mergeGeometries(parts)!;
}
const rootGeo = rootGeometry();
const trunkGeo = trunkGeometry();

// One frond: a curved ribbon carrying the pinnae texture; it arches up, then droops toward the tip.
function frondGeometry(length: number, elevation: number, azimuth: number, color: Color, droop: number, twist: number) {
  const S = 16, pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [], W = length * .36;
  for (let j = 0; j <= S; j++) {
    const s = j / S, x = s * length, y = Math.sin(s * Math.PI * .65) * length * .22 - s * s * length * droop;
    const w = W * Math.sin(Math.PI * Math.min(1, s * .95 + .05));
    for (const side of [-1, 0, 1]) {
      // Pinnae hang a little below the rachis and the blade twists slightly along its length.
      const z = side * w * Math.cos(twist * s), yy = y - Math.abs(side) * w * .28 + side * w * Math.sin(twist * s) * .5;
      pos.push(x, yy, z); uv.push((side + 1) / 2, s);
      const shade = .82 + .18 * s; col.push(color.r * shade, color.g * shade, color.b * shade);
    }
    if (j < S) { const n = j * 3; idx.push(n, n + 3, n + 1, n + 1, n + 3, n + 4, n + 1, n + 4, n + 2, n + 2, n + 4, n + 5); }
  }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setAttribute('color', new Float32BufferAttribute(col, 3)); g.setIndex(idx);
  g.rotateZ(elevation); g.rotateY(azimuth); g.computeVertexNormals();
  return g.toNonIndexed();
}
const frondGreens = ['#7ea64e', '#8bb257', '#739c47', '#86ab50'].map(c => new Color(c)), dead = new Color('#b08a55');
const crownCache = new Map<number, { crown: BufferGeometry; nuts: BufferGeometry }>();
function crownParts(seed: number) {
  let parts = crownCache.get(seed);
  if (parts) return parts;
  const fronds: BufferGeometry[] = [], R = rng(seed + 1);
  // Young fronds point up, mature ones spread level, a couple of old brown ones hang against the trunk.
  for (let k = 0; k < 17; k++) {
    const az = k * 2.39996 + R() * .3, tier = k < 4 ? 0 : k < 16 ? 1 : 2;
    const elev = tier === 0 ? .75 + R() * .25 : tier === 1 ? .05 + R() * .35 - (k % 3) * .12 : -1.15 - R() * .2;
    const len = tier === 0 ? 2.3 + R() * .4 : 3 + R() * .7;
    fronds.push(frondGeometry(len, elev, az, tier === 2 ? dead : frondGreens[k % 4], tier === 0 ? .1 : .32 + R() * .12, (R() - .5) * 1.2));
  }
  const nuts: BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) { const g = new SphereGeometry(.13, 12, 9); g.scale(1, 1.15, 1); g.translate(Math.cos(k * 1.9) * .22, -.3 - (k % 2) * .12, Math.sin(k * 1.9) * .22); nuts.push(g); }
  parts = { crown: mergeGeometries(fronds)!, nuts: mergeGeometries(nuts)! };
  crownCache.set(seed, parts);
  return parts;
}

export function LowPolyPalm({ position, scale = 1, seed = 0, yaw = 0, lean = 0 }: { position: V; scale?: number; seed?: number; yaw?: number; lean?: number }) {
  const crown = useRef<Group>(null), time = useRef(seed), m = palmMaterials();
  const { crown: fronds, nuts } = useMemo(() => crownParts(seed % 9), [seed]);
  useFrame((_, dt) => {
    if (journey.paused || journey.reduced || !crown.current) return;
    time.current += Math.min(dt, .05);
    crown.current.rotation.z = Math.sin(time.current * .9 + seed) * .03;
    crown.current.rotation.x = Math.sin(time.current * .7 + seed * 2) * .02;
  });
  // The roots stay flat on the sand; only the trunk and crown lean.
  return <group position={position} rotation={[0, yaw, 0]} scale={scale}>
    <mesh geometry={rootGeo} material={m.roots} castShadow receiveShadow raycast={noRaycast} />
    <group rotation={[0, 0, -lean]}>
      <mesh geometry={trunkGeo} material={m.bark} castShadow receiveShadow raycast={noRaycast} />
      <group ref={crown} position={[BEND, HEIGHT, 0]} rotation={[0, seed * 1.3, 0]}>
        <mesh geometry={fronds} material={m.frond} customDepthMaterial={m.frondDepth} castShadow receiveShadow raycast={noRaycast} />
        <mesh geometry={nuts} material={m.nut} castShadow raycast={noRaycast} />
      </group>
    </group>
  </group>;
}

// ---------- Leafy shrub ----------
// Hundreds of textured leaves on a few overlapping lobes. Leaf normals are bent toward each lobe's
// outward direction, so the bush shades as one soft rounded mass instead of a pile of cards.
const windShrub = { base: 0, amp: .0025, flutter: .0018 };
export const foliageMaterial = addWind(new MeshStandardMaterial({ map: broadTexture(), vertexColors: true, roughness: .55 }), windShrub);
export const foliageDepth = addWind(new MeshDepthMaterial({ depthPacking: RGBADepthPacking }), windShrub);
const leafGreens = ['#3f7a35', '#4b8a3c', '#356c2e', '#5a9645', '#2f6229'].map(c => new Color(c));
const bracts = ['#d42d7c', '#e2458a', '#b81e66', '#f05a9a'].map(c => new Color(c));
const shrubCache = new Map<string, BufferGeometry>();
const base = leafGeometry.index ? leafGeometry.toNonIndexed() : leafGeometry;

function leafAt(R: () => number, center: Vector3, radius: number, color: Color, size: number, out: BufferGeometry[], inner = false) {
  const dir = new Vector3(R() * 2 - 1, R() * 1.4 - .35, R() * 2 - 1).normalize();
  const p = center.clone().addScaledVector(dir, radius * (inner ? .3 + R() * .45 : .72 + R() * .3));
  const n = dir.clone().add(new Vector3(R() - .5, R() - .5, R() - .5).multiplyScalar(.7)).normalize();
  const t = new Vector3(R() - .5, R() - .5, R() - .5).cross(n).normalize(), x = t.clone().cross(n).normalize();
  const g = base.clone().applyMatrix4(new Matrix4().makeBasis(x.multiplyScalar(size), t.multiplyScalar(size), n.clone().multiplyScalar(size)).setPosition(p));
  const cnt = g.attributes.position.count, nrm = new Float32Array(cnt * 3), col = new Float32Array(cnt * 3);
  // Leaves deeper inside the bush are darker (self-shadowing).
  const depth = .62 + .38 * Math.min(1, p.distanceTo(center) / radius);
  const bent = dir.clone().multiplyScalar(.75).add(n.clone().multiplyScalar(.25)).normalize();
  for (let i = 0; i < cnt; i++) { nrm.set([bent.x, bent.y, bent.z], i * 3); col.set([color.r * depth, color.g * depth, color.b * depth], i * 3); }
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3)); g.setAttribute('color', new Float32BufferAttribute(col, 3));
  out.push(g);
}
export function shrubGeometry(seed: number, flowers: boolean) {
  const key = `${seed}|${flowers}`;
  let g = shrubCache.get(key);
  if (g) return g;
  const R = rng(seed * 7 + 3), parts: BufferGeometry[] = [], lobes = 5;
  for (let i = 0; i < lobes; i++) {
    const a = i / lobes * Math.PI * 2 + rnd(seed + i), r = i === 0 ? 0 : .36 + rnd(seed + i * 5) * .2;
    const c = new Vector3(Math.cos(a) * r, .42 + (i === 0 ? .22 : rnd(seed + i * 2) * .12), Math.sin(a) * r), rad = .42 + rnd(seed + i * 3) * .16;
    for (let k = 0; k < 170; k++) leafAt(R, c, rad, leafGreens[Math.floor(R() * 5)], .14 + R() * .06, parts);
    // Inner leaves fill the lobe so the bush reads as a dense mass, not a hollow shell.
    for (let k = 0; k < 90; k++) leafAt(R, c, rad, leafGreens[Math.floor(R() * 5)], .16 + R() * .06, parts, true);
    if (flowers) for (let k = 0; k < 44; k++) leafAt(R, c, rad * 1.04, bracts[Math.floor(R() * 4)], .1 + R() * .04, parts);
  }
  g = mergeGeometries(parts)!;
  parts.forEach(p => p.dispose());
  shrubCache.set(key, g);
  return g;
}

export function LowPolyShrub({ position, scale = 1, seed = 0, flowers = false }: { position: V; scale?: number; seed?: number; flowers?: boolean }) {
  const geometry = useMemo(() => shrubGeometry(seed % 12, flowers), [seed, flowers]);
  return <group position={position} scale={scale}>
    <mesh geometry={geometry} material={foliageMaterial} customDepthMaterial={foliageDepth} castShadow receiveShadow raycast={noRaycast} />
  </group>;
}
