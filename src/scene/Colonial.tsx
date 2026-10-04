import { flat, lampGlass, limewash, nightGlass, PALETTE } from './flat';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { useMemo } from 'react';
import { BoxGeometry, CanvasTexture, Color, PlaneGeometry, SRGBColorSpace, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Shape, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, type Material } from 'three';
import { leafGeometry, rng, trunk } from './Mango';
import { foliageDepth, foliageMaterial, shrubGeometry } from './LowPoly';
import { addWind } from './wind';
import { batchStatic } from './batchStatic';
import { addOutline } from './outline';
import { broadTexture } from './realism';

const tileGeo = (() => { const g = new CylinderGeometry(.1, .085, .42, 8, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); return g; })();
const canalGeo = (() => { const g = new CylinderGeometry(.118, .1, .44, 10, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); return g; })();
const tilePalette = ['#d26a43', '#c96240', '#d87650', '#bf5a3a', '#b85634'].map(c => new Color(c));

// Blue-and-white azulejo with the house number, as on colonial facades in Coro or Margarita.
function numberTile(n: number) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 180; const k = c.getContext('2d')!;
  k.fillStyle = '#f6f2e8'; k.fillRect(0, 0, 256, 180); k.strokeStyle = '#2d5f9e'; k.lineWidth = 10; k.strokeRect(10, 10, 236, 160);
  k.lineWidth = 3; k.strokeRect(24, 24, 208, 132); k.fillStyle = '#2d5f9e'; k.font = 'italic 92px Georgia, serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('Nº ' + n, 128, 96);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
}


// Doorway curtain: Venezuelan coastal houses keep the door open for the breeze with a printed cloth
// hung across it. Folded plane with a floral print; the dim room shows through the gap at the bottom.
const curtainGeo = (() => { const g = new PlaneGeometry(1.32, 2.2, 40, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 26) * .025 + Math.sin(x * 9 + 1) * .012); } g.computeVertexNormals(); return g; })();
const curtainMats = new Map<string, MeshStandardMaterial>();
function curtainMaterial(bg: string, ink: string) {
  const key = bg + ink; let m = curtainMats.get(key); if (m) return m;
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const k = c.getContext('2d')!;
  k.fillStyle = bg; k.fillRect(0, 0, 256, 512);
  const R = rng(bg.length * 7 + ink.charCodeAt(1));
  for (let i = 0; i < 46; i++) { const x = R() * 256, y = R() * 512, r = 7 + R() * 9; k.fillStyle = ink; for (let a = 0; a < 5; a++) { k.beginPath(); k.ellipse(x + Math.cos(a * 1.257) * r * .8, y + Math.sin(a * 1.257) * r * .8, r * .55, r * .35, a * 1.257, 0, Math.PI * 2); k.fill(); } k.fillStyle = '#f6d34a'; k.beginPath(); k.arc(x, y, r * .3, 0, Math.PI * 2); k.fill(); }
  k.fillStyle = 'rgba(0,0,0,.12)'; k.fillRect(0, 490, 256, 22);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  m = new MeshStandardMaterial({ map: t, roughness: .95, side: DoubleSide }); curtainMats.set(key, m); return m;
}
const CURTAINS: [string, string][] = [['#f4efe2', '#d8432f'], ['#2f6f9e', '#f4efe2'], ['#f2c14e', '#c4312b'], ['#e9e2f0', '#7a2c5a'], ['#cfe7d8', '#2f8f87']];
// Lace half-curtain behind the window grille.
const laceMat = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const k = c.getContext('2d')!; k.fillStyle = 'rgba(255,255,255,.82)'; k.fillRect(0, 0, 128, 128); k.globalCompositeOperation = 'destination-out'; for (let y = 8; y < 128; y += 16) for (let x = 8; x < 128; x += 16) { k.beginPath(); k.arc(x + (y / 16 % 2) * 8, y, 4, 0, Math.PI * 2); k.fill(); } const t = new CanvasTexture(c); t.wrapS = t.wrapT = 1000; t.repeat.set(4, 3); return new MeshStandardMaterial({ map: t, transparent: true, roughness: 1, side: DoubleSide, depthWrite: false }); })();

export type ColonialOptions = {
  width: number; depth: number; height?: number;
  wall?: string; zocalo?: string; door?: string;
  portico?: boolean;            // open front with two pillars instead of door and windows
  windows?: number[];           // x positions of front windows (ignored with portico)
  doorX?: number;
  bougainvillea?: boolean;
  seed?: number;
};

// Coastal colonial house, like in Margarita or Coro: thick limewashed walls with deep openings,
// turned wooden window grilles, a two-leaf door, blue base band, cornice and a gable of clay tiles.
// The front face sits on z = 0 and the house extends toward -z; the floor platform is 0.3 m high.
export function createColonialHouse(o: ColonialOptions) {
  const { width, depth, height = 3.6, wall = '#f3ead8', zocalo = '#2f6f9e', door = '#2e6f6a', portico = false, windows = [-width * .3, width * .3], doorX = 0, bougainvillea = false, seed = 1 } = o;
  const g = new Group(), R = rng(seed);
  const wallM=limewash(wall),trim=flat(PALETTE.trim);
  const blue=flat(zocalo),woodM=flat(PALETTE.wood),dark=nightGlass,stone=flat(PALETTE.stone);
  const box = (w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, parent: Group = base) => { const m = new Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.018,w/8,h/8,d/8)), mat); m.position.set(x, y, z); const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,uv=m.geometry.attributes.uv;for(let i=0;i<p.count;i++){uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i)+z:p.getX(i)+x)*.6,(Math.abs(n.getY(i))>.5?p.getZ(i)+z:p.getY(i)+y)*.6);} m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const plat = new Mesh(new BoxGeometry(width + 1.2, .3, depth + 1.2), stone); plat.position.set(0, .15, -depth / 2 + .2); plat.castShadow = plat.receiveShadow = true; g.add(plat);
  const base = new Group(); base.position.y = .3; g.add(base);
  const T = .42;
  // Front wall with openings: [x, width, bottom, height]
  // Portico: one wide basket-handle arch (half-width archA, jambs up to archH, then an elliptical crown).
  const archA = width / 2 - .78, archRise = .62, archH = height - .45 - archRise;
  const openings: number[][] = portico ? [[0, archA * 2, 0, height]] : [...windows.map(x => [x, 1.15, .95, 1.75]), [doorX, 1.45, 0, 2.55]];
  const xs = [-width / 2]; [...openings].sort((a, b) => a[0] - b[0]).forEach(op => xs.push(op[0] - op[1] / 2, op[0] + op[1] / 2)); xs.push(width / 2);
  if (!portico) for (let i = 0; i < xs.length; i += 2) { const w = xs[i + 1] - xs[i]; if (w > .01) box(w, height, T, wallM, (xs[i] + xs[i + 1]) / 2, height / 2, -T / 2); }
  if (!portico) openings.forEach(op => { if (op[2] > 0) box(op[1], op[2], T, wallM, op[0], op[2] / 2, -T / 2); const topH = height - op[2] - op[3]; if (topH > .01) box(op[1], topH, T, wallM, op[0], op[2] + op[3] + topH / 2, -T / 2); });
  box(T, height, depth, wallM, -width / 2 + T / 2, height / 2, -depth / 2); box(T, height, depth, wallM, width / 2 - T / 2, height / 2, -depth / 2);
  box(width, height, T, wallM, 0, height / 2, -depth + T / 2);
  // Blue base band, skipping openings that reach the floor
  for (let i = 0; i < xs.length; i += 2) { const w = xs[i + 1] - xs[i]; if (w > .01) box(w + .02, .72, .04, blue, (xs[i] + xs[i + 1]) / 2, .36, .02); }
  box(.04, .72, depth, blue, -width / 2 - .02, .36, -depth / 2); box(.04, .72, depth, blue, width / 2 + .02, .36, -depth / 2);
  if (!portico) {
    windows.forEach(x => {
      box(1.15, 1.75, .05, dark, x, 1.825, -T + .02);
      { const lace = new Mesh(new PlaneGeometry(1.1, .95), laceMat); lace.position.set(x, 1.45, -T + .06); base.add(lace); }
      box(1.45, .12, .26, trim, x, .9, .16);
      [-1, 1].forEach(s => box(.12, 2.05, .12, trim, x + s * .66, 1.85, .06));
      box(1.45, .14, .18, trim, x, 2.83, .06);
      const rj = new Group(); rj.position.set(x, 0, .22);
      box(1.3, .1, .3, woodM, 0, .98, 0, rj); box(1.3, .12, .3, woodM, 0, 2.72, 0, rj);
      for (let i = 0; i < 7; i++) { const bx = -.5 + i / 6; rj.add(trunk([bx, 1.03, 0], [bx, 2.66, 0], .035, .035, woodM, 8)); [1.4, 1.9, 2.3].forEach(y => { const k = new Mesh(new SphereGeometry(.045, 8, 6), woodM); k.position.set(bx, y, 0); rj.add(k); }); }
      const cap = new Mesh(new BoxGeometry(1.42, .08, .42), flat(PALETTE.terracotta)); cap.position.set(0, 2.84, .02); cap.rotation.x = .25; cap.castShadow = true; rj.add(cap);
      base.add(rj);
    });
    box(1.45, 2.55, .05, dark, doorX, 1.275, -T + .02);
    { const [bg, ink] = CURTAINS[Math.floor(R() * CURTAINS.length)], cur = new Mesh(curtainGeo, curtainMaterial(bg, ink)); cur.position.set(doorX, 1.42, -T + .07); cur.castShadow = true; base.add(cur); }
    const doorM = flat(door), panel = flat('#' + new Color(door).multiplyScalar(.85).getHexString());
    [-1, 1].forEach(s => { const leaf = new Group(); leaf.position.set(doorX + s * .72, 0, -T + .1); leaf.rotation.y = s * -1.1; box(.7, 2.5, .06, doorM, -s * .35, 1.25, 0, leaf); [.5, 1.25, 2].forEach(y => box(.5, .55, .03, panel, -s * .35, y, .04, leaf)); base.add(leaf); });
    [-1, 1].forEach(s => box(.16, 2.8, .16, trim, doorX + s * .83, 1.4, .06));
    box(1.82, .2, .2, trim, doorX, 2.7, .06);
    const lamp = new Group(); lamp.position.set(doorX + 1.25, 2.5, .25); lamp.add(trunk([0, 0, -.25], [0, 0, 0], .015, .015, dark, 6));
    const glass = new Mesh(new CylinderGeometry(.09, .07, .24, 6), lampGlass); glass.position.y = -.12; lamp.add(glass); base.add(lamp);
  } else {
    const arc = (a: number, rise: number, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const t = Math.PI * (1 - i / n); return [Math.cos(t) * a, archH + Math.sin(t) * rise] as const; });
    const front = new Shape();
    front.moveTo(-width / 2, 0); front.lineTo(-archA, 0);
    arc(archA, archRise).forEach(([x, y]) => front.lineTo(x, y));
    front.lineTo(archA, 0); front.lineTo(width / 2, 0); front.lineTo(width / 2, height); front.lineTo(-width / 2, height); front.closePath();
    const fw = new Mesh(new ExtrudeGeometry(front, { depth: T, bevelEnabled: false, curveSegments: 1 }), wallM); fw.position.set(0, 0, -T); fw.castShadow = fw.receiveShadow = true; base.add(fw);
    // Archivolt: a white band that follows the arch, with a keystone and plain jambs.
    const band = new Shape(), outer = arc(archA + .17, archRise + .17), inner = arc(archA, archRise).reverse();
    outer.forEach(([x, y], i) => i ? band.lineTo(x, y) : band.moveTo(x, y)); inner.forEach(([x, y]) => band.lineTo(x, y)); band.closePath();
    const av = new Mesh(new ExtrudeGeometry(band, { depth: .07, bevelEnabled: false, curveSegments: 1 }), trim); av.position.z = .0; av.castShadow = true; base.add(av);
    [-1, 1].forEach(s => box(.17, archH, .07, trim, s * (archA + .085), archH / 2, .035));
    box(.3, .42, .12, trim, 0, archH + archRise + .1, .05);
    [-1, 1].forEach(s => box(.36, .1, .14, trim, s * (archA + .1), archH, .06));
    // Corner pilasters and a wall lamp on each side of the arch.
    [-1, 1].forEach(s => { box(.32, height - .1, .1, trim, s * (width / 2 - .16), (height - .1) / 2, .04);
      const lamp = new Group(); lamp.position.set(s * (archA + .52), 2.35, .22); lamp.add(trunk([0, 0, -.22], [0, 0, 0], .015, .015, dark, 6));
      const cap = new Mesh(new CylinderGeometry(.02, .13, .08, 6), dark); cap.position.y = .02; lamp.add(cap);
      const glass = new Mesh(new CylinderGeometry(.1, .075, .26, 6), lampGlass); glass.position.y = -.13; lamp.add(glass); base.add(lamp); });
  }
  // Street wear: a downspout at the corner, and on houses with a door the electricity meter with its
  // conduit and a hand-painted tile with the house number above the door.
  const pvc = flat('#d4cfc4', { roughness: .5 }), grey = flat('#9fa39e', { roughness: .45 }), conduit = flat('#55595a', { roughness: .6 });
  const dsX = width / 2 - .16;
  base.add(trunk([dsX, 0, .1], [dsX, height - .12, .1], .045, .045, pvc, 10));
  base.add(trunk([dsX, height - .14, .1], [dsX, height + .02, .42], .045, .045, pvc, 10));
  box(.13, .06, .13, pvc, dsX, .03, .1);
  if (!portico) {
    const mx = -width / 2 + .34;
    box(.26, .36, .1, grey, mx, 1.6, .06);
    box(.14, .1, .02, dark, mx, 1.66, .115);
    base.add(trunk([mx, 1.78, .06], [mx, height - .1, .06], .016, .016, conduit, 6));
    const tile = new Mesh(new PlaneGeometry(.34, .24), new MeshStandardMaterial({ map: numberTile(10 + Math.floor(R() * 89)), roughness: .3 }));
    tile.position.set(doorX, 3.08, .01); base.add(tile);
  }
  // Cornice
  box(width + .2, .16, .5, trim, 0, height - .06, .04);
  box(width + .3, .12, .6, trim, 0, height + .08, .06);
  // Clay-tile gable roof along x, sloping toward ±z
  const pitch = .42, overhang = .55, half = depth / 2 + overhang, slopeLen = half / Math.cos(pitch), y0 = height + .14;
  const cols = Math.ceil((width + 2 * overhang) / .2), rows = Math.ceil(slopeLen / .33);
  const tileMat = new MeshStandardMaterial({ roughness: .62, side: DoubleSide });
  const tiles = new InstancedMesh(tileGeo, tileMat, cols * rows * 2 + cols), canals = new InstancedMesh(canalGeo, tileMat, cols * rows * 2), t = new Object3D();
  let nc = 0;
  let n = 0;
  [-1, 1].forEach(sd => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const along = (r + .5) * .33, cover = c % 2 === 0;
    t.position.set(-width / 2 - overhang + (c + .5) * .2 + (R() - .5) * .012, y0 + (half - along) * Math.tan(pitch) + (cover ? .1 : .045) + (R() - .5) * .01, -depth / 2 + sd * along * Math.cos(pitch));
    t.rotation.set(sd * (pitch + (R() - .5) * .04), (R() - .5) * .04, cover ? 0 : Math.PI); t.updateMatrix();
    const col = tilePalette[Math.floor(R() * 5)].clone().multiplyScalar(.9 + R() * .18);
    if (cover) { tiles.setMatrixAt(n, t.matrix); tiles.setColorAt(n, col); n++; } else { canals.setMatrixAt(nc, t.matrix); canals.setColorAt(nc, col.multiplyScalar(.85)); nc++; }
  } });
  for (let c = 0; c < cols; c++) { t.position.set(-width / 2 - overhang + (c + .5) * .2, y0 + half * Math.tan(pitch) + .1, -depth / 2); t.rotation.set(0, Math.PI / 2, 0); t.updateMatrix(); tiles.setMatrixAt(n, t.matrix); tiles.setColorAt(n, tilePalette[4]); n++; }
  tiles.count = n; tiles.castShadow = tiles.receiveShadow = true; base.add(tiles);
  canals.count = nc; canals.castShadow = canals.receiveShadow = true; base.add(canals);
  const deck = flat('#7e4130');
  [-1, 1].forEach(sd => { const p = new Mesh(new BoxGeometry(width + 2 * overhang, .06, slopeLen), deck); p.position.set(0, y0 + half * Math.tan(pitch) / 2, -depth / 2 + sd * half / 2); p.rotation.x = sd * pitch; p.castShadow = p.receiveShadow = true; base.add(p); });
  // Gable ends
  const tri = new Shape(), gh = (depth / 2) * Math.tan(pitch);
  tri.moveTo(-depth / 2, 0); tri.lineTo(depth / 2, 0); tri.lineTo(0, gh); tri.closePath();
  const gableGeo = new ExtrudeGeometry(tri, { depth: T, bevelEnabled: false });
  [-1, 1].forEach(s => { const gm = new Mesh(gableGeo, wallM); gm.rotation.y = Math.PI / 2; gm.position.set(s * (width / 2) - (s > 0 ? T : 0), y0 - .02, -depth / 2); gm.castShadow = gm.receiveShadow = true; base.add(gm); });
  if (bougainvillea) {
    // Bougainvillea trained up the front corner: woody stems climb the pilaster from a planting hole,
    // run along the cornice and around onto the side wall; leaves and magenta bracts cling to the stems.
    const wx = width / 2, stemM = new MeshStandardMaterial({ color: '#5b4632', roughness: .9 });
    const runs: number[][][] = [
      [[wx + .08, 0, .14], [wx + .03, 1.1, .1], [wx + .09, 2.2, .13], [wx + .04, height - .1, .1], [wx - .7, height + .02, .3], [wx - 1.5, height + .05, .34]],
      [[wx + .04, height - .5, .1], [wx + .1, height - .3, -.7], [wx + .1, height - .05, -1.6]],
    ];
    const pts: { p: number[]; up: number }[] = [];
    runs.forEach(run => { for (let i = 0; i < run.length - 1; i++) {
      g.add(trunk(run[i], run[i + 1], i === 0 ? .045 : .03, .025, stemM, 6));
      for (let k = 0; k < 10; k++) { const t = k / 10, q = run[i].map((v, j) => v + (run[i + 1][j] - v) * t); pts.push({ p: q, up: q[1] / height }); }
    } });
    const mat = addWind(new MeshStandardMaterial({ map: broadTexture(), roughness: .6, side: DoubleSide }), { base: .5, amp: .0015, flutter: .002 });
    const N = 900, bm = new InstancedMesh(leafGeometry, mat, N), b = new Object3D();
    const greens = ['#2f5a2e', '#3d6b34', '#356230'].map(c => new Color(c)), pinks = ['#c8246b', '#e0408a', '#a81d5c'].map(c => new Color(c));
    for (let i = 0; i < N; i++) {
      const s = pts[Math.floor(R() * pts.length)], spread = .1 + s.up * .16, bract = R() < .15 + s.up * .45;
      b.position.set(s.p[0] + (R() * 2 - 1) * spread, s.p[1] + (R() * 2 - 1) * spread - (bract ? R() * .12 : 0), s.p[2] + R() * spread);
      b.rotation.set(R() * 6, R() * 6, R() * 6); b.scale.setScalar((bract ? .1 : .14) * (.8 + R() * .4)); b.updateMatrix();
      bm.setMatrixAt(i, b.matrix); bm.setColorAt(i, bract ? pinks[i % 3] : greens[i % 3]);
    }
    bm.castShadow = true; g.add(bm);
  }
  const potM = flat(PALETTE.terracotta), bushM = foliageMaterial;
  (portico ? [-width / 2 + .3, width / 2 - .3] : [doorX - 1.35, doorX + 1.5]).forEach((x, i) => { const p = new Mesh(new CylinderGeometry(.26, .19, .48, 20), potM); p.position.set(x, .54, .55); p.castShadow = true; g.add(p); const b = new Mesh(shrubGeometry(seed + i, i % 2 === 0), bushM); b.position.set(x, .72, .55); b.scale.setScalar(.55); b.castShadow = b.receiveShadow = true; b.customDepthMaterial = foliageDepth; g.add(b); });
  return addOutline(batchStatic(g));
}

export function ColonialHouse({ position, rotation = 0, ...o }: ColonialOptions & { position: [number, number, number]; rotation?: number }) {
  const house = useMemo(() => createColonialHouse(o), [JSON.stringify(o)]);
  return <primitive object={house} position={position} rotation={[0, rotation, 0]} />;
}




