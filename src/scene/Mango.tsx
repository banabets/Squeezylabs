import { foliageMap } from './Botanical';
import { useMemo } from 'react';
import { BufferGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Mesh, MeshDepthMaterial, MeshStandardMaterial, Object3D, Quaternion, RGBADepthPacking, Shape, ShapeGeometry, SphereGeometry, Vector3, type Material } from 'three';
import { addWind } from './wind';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function rng(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// Broad leaf used by hedges and flowers.
export const leafGeometry = (() => { const s = new Shape(); s.moveTo(0, 0); s.quadraticCurveTo(.42, .45, 0, 1.25); s.quadraticCurveTo(-.42, .45, 0, 0); return new ShapeGeometry(s, 5); })();

// Long mango leaf, folded along the midrib; length 1 along +y.
const lanceGeometry = (() => {
  const g = new BufferGeometry(), p: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= 5; j++) {
    const t = j / 5, w = Math.pow(Math.sin(Math.PI * Math.min(t * 1.12, 1)), .8) * .11;
    for (let s = -1; s <= 1; s++) {p.push(s * w, t, -Math.abs(s) * w * .3-t*t*.14);uv.push((s+1)/2,t);}
    if (j < 5) { const n = j * 3; idx.push(n, n + 3, n + 1, n + 1, n + 3, n + 4, n + 1, n + 4, n + 2, n + 2, n + 4, n + 5); }
  }
  g.setAttribute('position', new Float32BufferAttribute(p, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
})();

export function trunk(a: number[], b: number[], r0: number, r1: number, mat: Material, segments = 10) {
  const A = new Vector3(a[0], a[1], a[2]), B = new Vector3(b[0], b[1], b[2]), dir = B.clone().sub(A);
  const m = new Mesh(new CylinderGeometry(r1, r0, dir.length(), segments), mat);
  m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
  m.castShadow = m.receiveShadow = true;
  return m;
}

let shared: { leaf: MeshStandardMaterial; fruit: MeshStandardMaterial; leafDepth: MeshDepthMaterial; fruitDepth: MeshDepthMaterial; bark: MeshStandardMaterial; stem: MeshStandardMaterial; fruitGeo: SphereGeometry } | null = null;
function materials() {
  if (shared) return shared;
  const fruitGeo = new SphereGeometry(.1, 12, 9); fruitGeo.scale(1, 1.32, .88);
  const wind = { base: 2.5, amp: .012, flutter: .012 };
  shared = {
    leaf: addWind(new MeshStandardMaterial({map:foliageMap(), roughness: .62, side: DoubleSide }), wind),
    fruit: addWind(new MeshStandardMaterial({ roughness: .4 }), { ...wind, flutter: 0 }),
    leafDepth: addWind(new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide }), wind),
    fruitDepth: addWind(new MeshDepthMaterial({ depthPacking: RGBADepthPacking }), { ...wind, flutter: 0 }),
    bark: new MeshStandardMaterial({ color: '#5a4632', roughness: .95 }),
    stem: new MeshStandardMaterial({ color: '#4d5a2a', roughness: .8 }),
    fruitGeo,
  };
  return shared;
}

const greens = ['#91aa74', '#adc28c', '#819b69', '#bdcc97', '#829a63'].map(c => new Color(c));
const flushColors = ['#7e3426', '#9a4a30', '#b26a40', '#8f5a34'].map(c => new Color(c));
const fruitColors = ['#6f9a34', '#a9b23a', '#e6b230', '#ef8a2a', '#d4532c'].map(c => new Color(c));
const noRaycast = () => {};
type Tip = { p: Vector3; d: Vector3; big: boolean; flush?: boolean; n?: number };

// A mature mango tree grown branch by branch: buttressed trunk, five scaffold limbs that fork four times,
// rosettes of long leaves at every tip, copper-colored new flush and fruit hanging on long stems.
// About 9 m tall at scale 1. Coordinates are in the parent's space.
export function createMangoTree(x: number, z: number, seed: number, scale = 1) {
  const m = materials(), g = new Group(), R = rng(seed), tips: Tip[] = [], Y = new Vector3(0, 1, 0);
  g.position.set(x, 0, z); g.scale.setScalar(scale); g.rotation.y = R() * 6.28;
  g.add(trunk([0, 0, 0], [0, 2.7, 0], .46, .32, m.bark, 12));
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * 6.283, root = new Mesh(new ConeGeometry(.22, 1.1, 6), m.bark);
    root.position.set(Math.cos(a) * .42, .18, Math.sin(a) * .42); root.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); root.castShadow = true; g.add(root);
  }
  function grow(p: Vector3, dir: Vector3, len: number, rad: number, depth: number) {
    const e = p.clone().addScaledVector(dir, len);
    g.add(trunk(p.toArray(), e.toArray(), rad, rad * .72, m.bark, depth > 2 ? 8 : 5));
    if (depth === 0) { tips.push({ p: e, d: dir.clone(), big: true }); return; }
    if (depth <= 3) { tips.push({ p: p.clone().lerp(e, .55), d: dir.clone(), big: false }); if (depth <= 2) tips.push({ p: p.clone().lerp(e, .85), d: dir.clone(), big: false }); }
    const n = depth >= 3 ? 3 : 2 + (R() < .55 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const nd = dir.clone(), ax = new Vector3(R() - .5, R() * .2, R() - .5).cross(dir);
      if (ax.lengthSq() < 1e-4) ax.set(1, 0, 0);
      ax.normalize();
      nd.applyAxisAngle(ax, .38 + R() * .42); nd.applyAxisAngle(dir, k / n * 6.283 + R()); nd.y -= .1 * (4 - depth); nd.normalize();
      grow(e, nd, len * (.7 + R() * .12), rad * .62, depth - 1);
    }
  }
  const top = new Vector3(0, 2.6, 0);
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + R() * .5; grow(top, new Vector3(Math.cos(a) * .8, 1, Math.sin(a) * .8).normalize(), 2.4 + R() * .5, .24, 4); }

  let count = 0;
  for (const tp of tips) { tp.flush = tp.big && R() < .07; tp.n = tp.big ? 30 : 16; count += tp.n; }
  const leaves = new InstancedMesh(lanceGeometry, m.leaf, count), o = new Object3D(), u = new Vector3(), v = new Vector3(), ld = new Vector3(), q = new Quaternion(), q2 = new Quaternion();
  let idx = 0;
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  let stride=7919;while(gcd(stride,count)!==1)stride++;
  for (const tp of tips) {
    u.set(1, 0, 0); if (Math.abs(tp.d.x) > .9) u.set(0, 0, 1);
    u.cross(tp.d).normalize(); v.copy(tp.d).cross(u).normalize();
    for (let k = 0; k < tp.n!; k++) {
      const phi = k / tp.n! * 6.283 + R() * .4, th = .85 + R() * .55;
      ld.copy(tp.d).multiplyScalar(Math.cos(th)).addScaledVector(u, Math.sin(th) * Math.cos(phi)).addScaledVector(v, Math.sin(th) * Math.sin(phi));
      ld.y -= .15 + R() * .25; ld.normalize();
      q.setFromUnitVectors(Y, ld); q2.setFromAxisAngle(ld, phi + R());
      o.quaternion.copy(q2).multiply(q); o.position.copy(tp.p);
      const L = (tp.big ? .45 : .36) * (.8 + R() * .4); o.scale.set(L * 1.5, L, L);
      const slot=(idx*stride)%count;
      o.updateMatrix(); leaves.setMatrixAt(slot, o.matrix);
      leaves.setColorAt(slot, tp.flush && k % 3 !== 0 ? flushColors[k % 4] : greens[(k + idx) % 5]); idx++;
    }
  }
  const hanging: number[][] = [];
  for (const tp of tips) {
    if (!tp.big || tp.flush || R() > .32) continue;
    const L = .35 + R() * .4, end = tp.p.clone().add(new Vector3((R() - .5) * .15, -L, (R() - .5) * .15));
    g.add(trunk(tp.p.toArray(), end.toArray(), .008, .006, m.stem, 4));
    const n = 1 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) hanging.push([end.x + (k - 1) * .09, end.y - .1 - k * .04, end.z + (R() - .5) * .08, Math.floor(R() * 5)]);
  }
  const fruits = new InstancedMesh(m.fruitGeo, m.fruit, Math.max(1, hanging.length));
  hanging.forEach((f, i) => { o.position.set(f[0], f[1], f[2]); o.quaternion.identity(); o.rotation.set(0, R() * 6, (R() - .5) * .3); o.scale.setScalar(1.05 + R() * .3); o.updateMatrix(); fruits.setMatrixAt(i, o.matrix); fruits.setColorAt(i, fruitColors[f[3]]); });
  fruits.count = hanging.length;
  leaves.customDepthMaterial = m.leafDepth; fruits.customDepthMaterial = m.fruitDepth;
  // Collapse hundreds of stationary branches into two draws; keep moving foliage instanced.
  for (const material of [m.bark,m.stem]) {
    const branches=g.children.filter((o):o is Mesh=>o instanceof Mesh&&o.material===material);
    const parts=branches.map(b=>{b.updateMatrix();return b.geometry.clone().applyMatrix4(b.matrix);});
    if(parts.length){const geometry=mergeGeometries(parts);if(geometry){const batch=new Mesh(geometry,material);batch.castShadow=batch.receiveShadow=true;batch.raycast=noRaycast;g.add(batch);for(const b of branches){g.remove(b);b.geometry.dispose();}}parts.forEach(p=>p.dispose());}
  }
  for (const mesh of [leaves, fruits]) { mesh.castShadow = mesh.receiveShadow = true; mesh.computeBoundingSphere(); if(mesh.boundingSphere)mesh.boundingSphere.radius+=1; mesh.raycast = noRaycast; g.add(mesh); }
  g.userData.foliage={leaves,fruits,total:count,fruitCount:hanging.length};
  return g;
}

export function MangoTree({ position, seed = 1, scale = 1 }: { position: [number, number]; seed?: number; scale?: number }) {
  const tree = useMemo(() => createMangoTree(position[0], position[1], seed, scale), [position[0], position[1], seed, scale]);
  return <primitive object={tree} />;
}

