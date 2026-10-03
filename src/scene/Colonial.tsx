import { flat, lampGlass, nightGlass, PALETTE } from './flat';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { useMemo } from 'react';
import { BoxGeometry, Color, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, Shape, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, SphereGeometry, type Material } from 'three';
import { leafGeometry, rng, trunk } from './Mango';
import { shrubGeometry } from './LowPoly';
import { addWind } from './wind';
import { batchStatic } from './batchStatic';
import { addOutline } from './outline';

const tileGeo = (() => { const g = new CylinderGeometry(.1, .085, .42, 8, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.rotateY(Math.PI / 2); return g; })();
const tilePalette = ['#d26a43', '#c96240', '#d87650', '#bf5a3a', '#b85634'].map(c => new Color(c));

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
  const wallM=flat(wall),trim=flat(PALETTE.trim);
  const blue=flat(zocalo),woodM=flat(PALETTE.wood),dark=nightGlass,stone=flat(PALETTE.stone);
  const box = (w: number, h: number, d: number, mat: Material, x: number, y: number, z: number, parent: Group = base) => { const m = new Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.018,w/8,h/8,d/8)), mat); m.position.set(x, y, z); const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,uv=m.geometry.attributes.uv;for(let i=0;i<p.count;i++){uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i)+z:p.getX(i)+x)*.6,(Math.abs(n.getY(i))>.5?p.getZ(i)+z:p.getY(i)+y)*.6);} m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  const plat = new Mesh(new BoxGeometry(width + 1.2, .3, depth + 1.2), stone); plat.position.set(0, .15, -depth / 2 + .2); plat.castShadow = plat.receiveShadow = true; g.add(plat);
  const base = new Group(); base.position.y = .3; g.add(base);
  const T = .42;
  // Front wall with openings: [x, width, bottom, height]
  const openings: number[][] = portico ? [[0, width - 1.4, 0, height - .75]] : [...windows.map(x => [x, 1.15, .95, 1.75]), [doorX, 1.45, 0, 2.55]];
  const xs = [-width / 2]; [...openings].sort((a, b) => a[0] - b[0]).forEach(op => xs.push(op[0] - op[1] / 2, op[0] + op[1] / 2)); xs.push(width / 2);
  for (let i = 0; i < xs.length; i += 2) { const w = xs[i + 1] - xs[i]; if (w > .01) box(w, height, T, wallM, (xs[i] + xs[i + 1]) / 2, height / 2, -T / 2); }
  openings.forEach(op => { if (op[2] > 0) box(op[1], op[2], T, wallM, op[0], op[2] / 2, -T / 2); const topH = height - op[2] - op[3]; if (topH > .01) box(op[1], topH, T, wallM, op[0], op[2] + op[3] + topH / 2, -T / 2); });
  box(T, height, depth, wallM, -width / 2 + T / 2, height / 2, -depth / 2); box(T, height, depth, wallM, width / 2 - T / 2, height / 2, -depth / 2);
  box(width, height, T, wallM, 0, height / 2, -depth + T / 2);
  // Blue base band, skipping openings that reach the floor
  for (let i = 0; i < xs.length; i += 2) { const w = xs[i + 1] - xs[i]; if (w > .01) box(w + .02, .72, .04, blue, (xs[i] + xs[i + 1]) / 2, .36, .02); }
  box(.04, .72, depth, blue, -width / 2 - .02, .36, -depth / 2); box(.04, .72, depth, blue, width / 2 + .02, .36, -depth / 2);
  if (!portico) {
    windows.forEach(x => {
      box(1.15, 1.75, .05, dark, x, 1.825, -T + .02);
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
    const doorM = flat(door), panel = flat('#' + new Color(door).multiplyScalar(.85).getHexString());
    [-1, 1].forEach(s => { const leaf = new Group(); leaf.position.set(doorX + s * .72, 0, -T + .1); leaf.rotation.y = s * -1.1; box(.7, 2.5, .06, doorM, -s * .35, 1.25, 0, leaf); [.5, 1.25, 2].forEach(y => box(.5, .55, .03, panel, -s * .35, y, .04, leaf)); base.add(leaf); });
    [-1, 1].forEach(s => box(.16, 2.8, .16, trim, doorX + s * .83, 1.4, .06));
    box(1.82, .2, .2, trim, doorX, 2.7, .06);
    const lamp = new Group(); lamp.position.set(doorX + 1.25, 2.5, .25); lamp.add(trunk([0, 0, -.25], [0, 0, 0], .015, .015, dark, 6));
    const glass = new Mesh(new CylinderGeometry(.09, .07, .24, 6), lampGlass); glass.position.y = -.12; lamp.add(glass); base.add(lamp);
  } else {
    [-1, 1].forEach(s => { const x = s * (width / 2 - .7); box(.5, height - .75, .5, wallM, x, (height - .75) / 2, -T / 2); box(.62, .16, .62, trim, x, height - .83, -T / 2); box(.6, .2, .6, stone, x, .1, -T / 2); });
    box(width - .4, .18, .5, trim, 0, height - .66, -T / 2 + .04);
  }
  // Cornice
  box(width + .2, .16, .5, trim, 0, height - .06, .04);
  box(width + .3, .12, .6, trim, 0, height + .08, .06);
  // Clay-tile gable roof along x, sloping toward ±z
  const pitch = .42, overhang = .55, half = depth / 2 + overhang, slopeLen = half / Math.cos(pitch), y0 = height + .14;
  const cols = Math.ceil((width + 2 * overhang) / .2), rows = Math.ceil(slopeLen / .36);
  const tiles = new InstancedMesh(tileGeo, new MeshStandardMaterial({ roughness: .9, flatShading: true, side: DoubleSide }), cols * rows * 2 + cols), t = new Object3D();
  let n = 0;
  [-1, 1].forEach(sd => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const along = (r + .5) * .36;
    t.position.set(-width / 2 - overhang + (c + .5) * .2, y0 + (half - along) * Math.tan(pitch) + .05 + (c % 2 ? .035 : 0), -depth / 2 + sd * along * Math.cos(pitch));
    t.rotation.set(sd * pitch, 0, c % 2 ? Math.PI : 0); t.updateMatrix(); tiles.setMatrixAt(n, t.matrix); tiles.setColorAt(n, tilePalette[Math.floor(R() * 5)]); n++;
  } });
  for (let c = 0; c < cols; c++) { t.position.set(-width / 2 - overhang + (c + .5) * .2, y0 + half * Math.tan(pitch) + .1, -depth / 2); t.rotation.set(0, Math.PI / 2, 0); t.updateMatrix(); tiles.setMatrixAt(n, t.matrix); tiles.setColorAt(n, tilePalette[4]); n++; }
  tiles.count = n; tiles.castShadow = tiles.receiveShadow = true; base.add(tiles);
  const deck = flat(PALETTE.woodDark);
  [-1, 1].forEach(sd => { const p = new Mesh(new BoxGeometry(width + 2 * overhang, .06, slopeLen), deck); p.position.set(0, y0 + half * Math.tan(pitch) / 2, -depth / 2 + sd * half / 2); p.rotation.x = sd * pitch; p.castShadow = p.receiveShadow = true; base.add(p); });
  // Gable ends
  const tri = new Shape(), gh = (depth / 2) * Math.tan(pitch);
  tri.moveTo(-depth / 2, 0); tri.lineTo(depth / 2, 0); tri.lineTo(0, gh); tri.closePath();
  const gableGeo = new ExtrudeGeometry(tri, { depth: T, bevelEnabled: false });
  [-1, 1].forEach(s => { const gm = new Mesh(gableGeo, wallM); gm.rotation.y = Math.PI / 2; gm.position.set(s * (width / 2) - (s > 0 ? T : 0), y0 - .02, -depth / 2); gm.castShadow = gm.receiveShadow = true; base.add(gm); });
  if (bougainvillea) {
    const mat = addWind(new MeshStandardMaterial({ roughness: .9, flatShading: true, side: DoubleSide }), { base: .5, amp: .004, flutter: .008 });
    const bm = new InstancedMesh(leafGeometry, mat, 650), b = new Object3D();
    for (let i = 0; i < 650; i++) { b.position.set(width / 2 + .1 + (R() * 2 - 1) * .5, .3 + R() * height * .95, -.2 + (R() * 2 - 1) * .5); b.rotation.set(R() * 6, R() * 6, R() * 6); b.scale.setScalar((i % 3 === 0 ? .16 : .11) * (.8 + R() * .4)); b.updateMatrix(); bm.setMatrixAt(i, b.matrix); bm.setColorAt(i, new Color(i % 3 === 0 ? ['#2f5a2e', '#3d6b34'][i % 2] : ['#c8246b', '#e0408a', '#a81d5c'][i % 3])); }
    bm.castShadow = true; g.add(bm);
  }
  const potM = flat(PALETTE.terracotta), bushM = flat('#ffffff', { vertexColors: true });
  (portico ? [-width / 2 + .3, width / 2 - .3] : [doorX - 1.35, doorX + 1.5]).forEach((x, i) => { const p = new Mesh(new CylinderGeometry(.26, .19, .48, 8), potM); p.position.set(x, .54, .55); p.castShadow = true; g.add(p); const b = new Mesh(shrubGeometry(seed + i, i % 2 === 0), bushM); b.position.set(x, .72, .55); b.scale.setScalar(.55); b.castShadow = true; g.add(b); });
  return addOutline(batchStatic(g));
}

export function ColonialHouse({ position, rotation = 0, ...o }: ColonialOptions & { position: [number, number, number]; rotation?: number }) {
  const house = useMemo(() => createColonialHouse(o), [JSON.stringify(o)]);
  return <primitive object={house} position={position} rotation={[0, rotation, 0]} />;
}




