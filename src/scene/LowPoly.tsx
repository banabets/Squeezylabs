import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, Vector3, Quaternion } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { journey } from '../data/journey';
import { flat, painted, PALETTE } from './flat';
import { hullGeometry, outlineMaterial } from './outline';

type V = [number, number, number];
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const Y = new Vector3(0, 1, 0);
const vertexFlat = flat('#ffffff', { vertexColors: true }), vertexFlatDouble = flat('#ffffff', { vertexColors: true, doubleSide: true });

// One palm frond: a spine with sawtooth leaflets on both sides, drooping toward the tip.
function frond(length: number) {
  const pos: number[] = [], N = 13;
  const pt = (s: number, w: number): V => [s * length, Math.sin(s * Math.PI * .7) * .75 - s * s * 1.7 - Math.abs(w) * .3, w];
  for (let j = 0; j < N; j++) {
    const a = j / N, b = (j + 1) / N, s0 = pt(a, 0), s1 = pt(b, 0), ww = Math.sin(Math.min(1, (a + .04) * 1.1) * Math.PI) * .62;
    for (const side of [-1, 1]) { const e = pt(a + .75 / N, side * ww); e[0] += .22; pos.push(...s0, ...e, ...s1); }
  }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return g;
}

const HEIGHT = 5.6, BEND = .5, SEGMENTS = 8;
const palmCache = new Map<number, { trunk: BufferGeometry; crown: BufferGeometry; trunkHull: BufferGeometry; crownHull: BufferGeometry }>();
function palmParts(seed: number) {
  let parts = palmCache.get(seed);
  if (parts) return parts;
  const trunk: BufferGeometry[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const t = i / SEGMENTS, t2 = (i + 1) / SEGMENTS;
    const a = new Vector3(BEND * t * t, t * HEIGHT, 0), b = new Vector3(BEND * t2 * t2, t2 * HEIGHT, 0), dir = b.clone().sub(a), r = .27 - .11 * t;
    const g = new CylinderGeometry(r * .86, r, dir.length() * 1.04, 7);
    g.applyQuaternion(new Quaternion().setFromUnitVectors(Y, dir.normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
    trunk.push(painted(g, i % 2 ? PALETTE.bark : PALETTE.barkDark));
  }
  const crown: BufferGeometry[] = [];
  for (let k = 0; k < 9; k++) {
    const g = frond(2.6 + rnd(seed + k) * .9);
    g.rotateZ((rnd(seed + k * 7) - .5) * .3); g.rotateY(k / 9 * Math.PI * 2 + rnd(seed + k * 3) * .4);
    crown.push(painted(g, k % 2 ? PALETTE.leaf : PALETTE.leafLight));
  }
  for (let k = 0; k < 4; k++) { const g = new IcosahedronGeometry(.19, 0); g.translate(Math.cos(k * 1.7) * .24, -.22, Math.sin(k * 1.7) * .24); crown.push(painted(g, '#6b4a2b')); }
  const t = mergeGeometries(trunk)!, c = mergeGeometries(crown)!;
  parts = { trunk: t, crown: c, trunkHull: hullGeometry(t), crownHull: hullGeometry(c) };
  palmCache.set(seed, parts);
  return parts;
}

export function LowPolyPalm({ position, scale = 1, seed = 0, yaw = 0, lean = 0 }: { position: V; scale?: number; seed?: number; yaw?: number; lean?: number }) {
  const crown = useRef<Group>(null), time = useRef(seed);
  const { trunk, crown: leaves, trunkHull, crownHull } = useMemo(() => palmParts(seed), [seed]);
  useFrame((_, dt) => {
    if (journey.paused || journey.reduced || !crown.current) return;
    time.current += Math.min(dt, .05);
    crown.current.rotation.z = Math.sin(time.current * .9 + seed) * .035;
    crown.current.rotation.x = Math.sin(time.current * .7 + seed * 2) * .025;
  });
  return <group position={position} rotation={[0, yaw, -lean]} scale={scale}>
    <mesh geometry={trunk} material={vertexFlat} castShadow receiveShadow />
    <mesh geometry={trunkHull} material={outlineMaterial} raycast={noRaycast} />
    <group ref={crown} position={[BEND, HEIGHT, 0]}><mesh geometry={leaves} material={vertexFlatDouble} castShadow receiveShadow /><mesh geometry={crownHull} material={outlineMaterial} raycast={noRaycast} /></group>
  </group>;
}

const shrubCache = new Map<string, BufferGeometry>(), shrubHulls = new Map<BufferGeometry, BufferGeometry>();
const noRaycast = () => {};
export function shrubGeometry(seed: number, flowers: boolean) {
  const key = `${seed}|${flowers}`;
  let g = shrubCache.get(key);
  if (g) return g;
  const parts: BufferGeometry[] = [], count = 5;
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2 + rnd(seed + i), r = i === 0 ? 0 : .38 + rnd(seed + i * 5) * .2;
    const b = new IcosahedronGeometry(.42 + rnd(seed + i * 3) * .18, 1);
    b.rotateY(rnd(seed + i * 11) * 3); b.scale(1, .82, 1); b.translate(Math.cos(a) * r, .4 + (i === 0 ? .22 : rnd(seed + i * 2) * .12), Math.sin(a) * r);
    parts.push(painted(b, i % 2 ? PALETTE.leafLight : '#4a9444'));
  }
  if (flowers) for (let i = 0; i < 9; i++) {
    const a = i * 2.4 + seed, f = new IcosahedronGeometry(.11, 0);
    f.translate(Math.cos(a) * .55, .55 + rnd(seed + i * 13) * .4, Math.sin(a) * .55);
    parts.push(painted(f, i % 3 ? PALETTE.bougainvillea : '#c52f74'));
  }
  g = mergeGeometries(parts)!;
  shrubCache.set(key, g);
  return g;
}

export function LowPolyShrub({ position, scale = 1, seed = 0, flowers = false }: { position: V; scale?: number; seed?: number; flowers?: boolean }) {
  const geometry = useMemo(() => shrubGeometry(seed, flowers), [seed, flowers]);
  const hull = useMemo(() => { let h = shrubHulls.get(geometry); if (!h) { h = hullGeometry(geometry); shrubHulls.set(geometry, h); } return h; }, [geometry]);
  return <group position={position} scale={scale}>
    <mesh geometry={geometry} material={vertexFlat} castShadow receiveShadow />
    <mesh geometry={hull} material={outlineMaterial} raycast={noRaycast} />
  </group>;
}
