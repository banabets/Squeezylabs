import { useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  BoxGeometry, CanvasTexture, CapsuleGeometry, Color, CylinderGeometry, DoubleSide, Group, IcosahedronGeometry, InstancedMesh, LatheGeometry,
  Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, PointLight, RepeatWrapping, SRGBColorSpace,
  SphereGeometry, TextureLoader, TorusGeometry, Vector2, type Material, type MeshStandardMaterialParameters, type Texture,
} from 'three';
import { journey } from '../data/journey';
import { createMangoTree, trunk } from './Mango';
import { ColonialHouse } from './Colonial';
import { applyPbr } from './realism';
import { limewash } from './flat';
import { foliageDepth, foliageMaterial, shrubGeometry } from './LowPoly';
import { createCloth, createClothSet } from './Cloth';
import { simulationVisible } from './visibility';
import { batchStatic, instanceRepeated } from './batchStatic';

type Draw = (c: CanvasRenderingContext2D, w: number, h: number) => void;
const SANS = '"DM Sans",Arial,sans-serif', SERIF = '"Instrument Serif",Georgia,serif';
const noRaycast = () => {};

function text(c: CanvasRenderingContext2D, str: string, font: string, color: string, x: number, y: number) {
  c.font = font; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(str, x, y);
}
function fit(c: CanvasRenderingContext2D, str: string, font: string, color: string, x: number, y: number, max: number) {
  let size = parseFloat(font.match(/(\d+)px/)![1]);
  c.font = font;
  while (c.measureText(str).width > max && size > 10) { size -= 2; c.font = font.replace(/\d+px/, size + 'px'); }
  c.fillStyle = color; c.textAlign = 'center'; c.fillText(str, x, y);
}

// A Venezuelan corner store on the village plaza, with a whitewashed house next door, a mango tree
// and a clothesline in a strong wind. Built imperatively once; every clickable mesh carries userData.key.
function buildBodega() {
  const root = new Group();
  root.position.set(19, .06, 7); root.rotation.y = -Math.PI / 2;
  const redraws: (() => void)[] = [];
  const std = (hex: string, roughness = .9, extra: MeshStandardMaterialParameters = {}) => new MeshStandardMaterial({ color: new Color(hex), roughness, ...extra });
  function box(w: number, h: number, d: number, mat: Material | Material[], x: number, y: number, z: number, parent: Object3D = root) {
    const m = new Mesh(new BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  function beam(a: number[], b: number[], r0: number, r1: number, mat: Material, parent: Object3D = root) { const m = trunk(a, b, r0, r1, mat); parent.add(m); return m; }
  function plane(w: number, h: number, mat: Material, x: number, y: number, z: number, rx = 0) {
    const m = new Mesh(new PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.x = rx; m.receiveShadow = true; root.add(m); return m;
  }
  function ctex(w: number, h: number, draw: Draw, repeat?: [number, number]) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const t = new CanvasTexture(cv); t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    const run = () => { const c = cv.getContext('2d')!; c.clearRect(0, 0, w, h); draw(c, w, h); t.needsUpdate = true; };
    run(); redraws.push(run); return t;
  }
  const keyed = <T extends Object3D>(o: T, key: string) => { o.userData.key = key; return o; };

  // Street side: sidewalk and curb. The beach and sea come from the island terrain and water.
  plane(13.9, 2.6, std('#cfc8b9', 1), 2.65, .005, 1.3, -Math.PI / 2);
  box(13.9, .16, .22, std('#e4ded0'), 2.65, .08, 2.65);
  const floorTex = ctex(256, 256, c => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#b5523a' : '#ece4d2'; c.fillRect(x * 32, y * 32, 32, 32); }
  }, [3, 1.7]);
  plane(7.5, 4, new MeshStandardMaterial({ map: floorTex, roughness: .6 }), 0, .008, -2, -Math.PI / 2);

  // Building
  // Facade walls share the stucco-and-weathering material of the colonial houses.
  const yellow = limewash('#e9b93c'), blue = std('#2d6f9e', .85), white = std('#f4f1e8'), mint = limewash('#cfe6d9');
  box(2, 4.2, .25, yellow, -3, 2.1, -.125); box(2, 4.2, .25, yellow, 3, 2.1, -.125); box(4, 1.5, .25, yellow, 0, 3.45, -.125);
  box(2.02, .85, .27, blue, -3, .425, -.12); box(2.02, .85, .27, blue, 3, .425, -.12);
  box(8.3, .22, .42, white, 0, 4.3, -.1); box(8.3, .35, .3, yellow, 0, 4.58, -.15);
  [-2, 2].forEach(x => box(.14, 2.75, .3, white, x, 1.375, -.1));
  box(4.2, .12, .3, white, 0, 2.76, -.1);
  box(.25, 4.2, 4.25, mint, -3.875, 2.1, -2.125); box(.25, 4.2, 4.25, mint, 3.875, 2.1, -2.125); box(7.5, 4.2, .25, mint, 0, 2.1, -4.125);
  box(7.5, .12, 4, std('#f1eee6', .95), 0, 3.26, -2.125); box(8.2, .25, 4.5, white, 0, 4.2, -2.2);
  const signTex = ctex(1480, 210, (c, w, h) => {
    c.fillStyle = '#f6efd9'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2d6f9e'; c.lineWidth = 10; c.strokeRect(14, 14, w - 28, h - 28); c.lineWidth = 3; c.strokeRect(30, 30, w - 60, h - 60);
    text(c, 'VÍVERES · LICORES · CHARCUTERÍA', '600 26px ' + SANS, '#2d6f9e', w / 2, 68);
    text(c, 'Bodega', 'italic 400 120px ' + SERIF, '#c4312b', w / 2, 172);
    text(c, '★', '400 54px ' + SANS, '#e9b93c', 200, 140); text(c, '★', '400 54px ' + SANS, '#e9b93c', w - 200, 140);
  });
  plane(7.2, 1.02, new MeshStandardMaterial({ map: signTex, roughness: .85 }), 0, 3.6, .02);
  // Santamaría (rolling shutter), half up
  const shutterTex = ctex(64, 64, (c, w, h) => { for (let y = 0; y < h; y += 8) { const g = c.createLinearGradient(0, y, 0, y + 8); g.addColorStop(0, '#9aa1a3'); g.addColorStop(.5, '#cfd4d5'); g.addColorStop(1, '#80878a'); c.fillStyle = g; c.fillRect(0, y, w, 8); } }, [1, 6]);
  const shutterMat = new MeshStandardMaterial({ map: shutterTex, roughness: .5, metalness: .4 });
  const drum = new Mesh(new CylinderGeometry(.16, .16, 4.1, 24), shutterMat); drum.rotation.z = Math.PI / 2; drum.position.set(0, 2.92, .12); drum.castShadow = true; root.add(drum);
  plane(3.95, .42, shutterMat, 0, 2.5, .06).castShadow = true;
  // Window with iron grille and bougainvillea
  // Glazed window: reflective dark glass with a lace half-curtain behind the grille.
  box(1.3, 1.1, .1, new MeshStandardMaterial({ color: '#1c2a2a', roughness: .06, envMapIntensity: 1.6 }), 3, 1.85, 0);
  plane(1.24, .46, new MeshStandardMaterial({ color: '#efe8da', roughness: .95, transparent: true, opacity: .9 }), 3, 2.14, .056);
  const iron = std('#26302e', .5, { metalness: .5 });
  for (let i = 0; i < 8; i++) beam([2.42 + i * .165, 1.3, .1], [2.42 + i * .165, 2.4, .1], .012, .012, iron);
  [1.3, 1.85, 2.4].forEach(y => beam([2.36, y, .1], [3.64, y, .1], .012, .012, iron));
  box(1.4, .12, .28, white, 3, 1.24, .12);
  // Window box of bougainvillea, built from the same leaf-card foliage as the shrubs.
  const trough = new Mesh(new BoxGeometry(1.2, .2, .24), new MeshStandardMaterial({ color: '#b8603e', roughness: .85 })); trough.position.set(3, 1.4, .26); trough.castShadow = trough.receiveShadow = true; root.add(trough);
  [2.62, 3, 3.38].forEach((x, i) => { const b = new Mesh(shrubGeometry(5 + i * 3, i !== 1), foliageMaterial); b.scale.setScalar(.3); b.position.set(x, 1.48, .26); b.castShadow = b.receiveShadow = true; b.customDepthMaterial = foliageDepth; root.add(b); });
  const fioTex = ctex(512, 150, (c, w) => { c.fillStyle = '#fffdf6'; c.fillRect(0, 0, w, 150); text(c, 'Hoy no fío,', '600 52px ' + SANS, '#c4312b', w / 2, 66); text(c, 'mañana sí.', 'italic 400 58px ' + SERIF, '#2d6f9e', w / 2, 126); });
  plane(.9, .27, new MeshStandardMaterial({ map: fioTex, roughness: .8 }), .9, 2.55, -3.99);
  const tube = new Mesh(new CylinderGeometry(.025, .025, 1.8, 10), new MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e0', emissiveIntensity: 1.2 })); tube.rotation.z = Math.PI / 2; tube.position.set(0, 3.13, -2); root.add(tube);
  const lamp = new PointLight('#fff1d2', 6, 9, 2); lamp.position.set(0, 2.95, -2); root.add(lamp);
  // Bananas (cambures) hanging by the door
  const bananaMat = std('#e8c43a', .6);
  beam([-1.75, 2.7, .25], [-1.75, 2.35, .25], .006, .006, std('#6b5a3f'));
  for (let i = 0; i < 16; i++) { const a = i * 2.399, b = new Mesh(new SphereGeometry(.025, 8, 6), bananaMat), r = .05 + (i % 3) * .02; b.scale.set(1, 5, 1); b.position.set(-1.75 + Math.cos(a) * r, 2.18 + (i % 4) * .05, .25 + Math.sin(a) * r); b.rotation.set(Math.sin(a) * .5, 0, Math.cos(a) * .5); b.castShadow = true; root.add(b); }

  // Plátanos: a heavier green-to-yellow bunch hung beside the cambures.
  const platano = ['#9bb43c', '#c5c23f', '#e2c446'].map(c => std(c, .6));
  beam([-1.45, 2.7, .25], [-1.45, 2.4, .25], .006, .006, std('#6b5a3f'));
  for (let i = 0; i < 12; i++) { const a = i * 2.399, b = new Mesh(new SphereGeometry(.034, 8, 6), platano[i % 3]), r = .06 + (i % 3) * .025; b.scale.set(1, 5.5, 1); b.position.set(-1.45 + Math.cos(a) * r, 2.2 + (i % 4) * .05, .25 + Math.sin(a) * r); b.rotation.set(Math.sin(a) * .45, 0, Math.cos(a) * .45); b.castShadow = true; root.add(b); }

  // Packaging
  const packMats = (front: Texture, side: string) => { const s = std(side, .8); return [s, s, s, s, new MeshStandardMaterial({ map: front, roughness: .7 }), s]; };
  function addPack(geo: BoxGeometry, mats: Material[], x: number, y: number, z: number, key?: string, ry = 0) {
    const m = new Mesh(geo, mats); m.position.set(x, y + geo.parameters.height / 2, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true;
    if (key) keyed(m, key); root.add(m); return m;
  }
  const harinaTex = new TextureLoader().load('/materials/products/harina-pan.jpg'); harinaTex.colorSpace = SRGBColorSpace; harinaTex.anisotropy = 8;
  const harinaMats = packMats(harinaTex, '#f7c900'), harinaGeo = new BoxGeometry(.12, .2, .08);
  const filler = (big: string, small: string, bg: string, fg: string, band: string) => packMats(ctex(256, 320, (c, w) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, 320); c.fillStyle = band; c.fillRect(0, 190, w, 50);
    fit(c, big, 'italic 700 58px ' + SERIF, fg, w / 2, 150, 226); fit(c, small, '600 24px ' + SANS, bg, w / 2, 224, 226);
  }), bg);
  const fillers = [filler('Mary', 'ARROZ DE PRIMERA', '#f4f4ee', '#1f4fa0', '#d0202a'), filler('Fama de América', 'CAFÉ MOLIDO', '#9e1b1b', '#f3d27a', '#f3d27a'), filler('Toddy', 'ACHOCOLATADO', '#1d4f9a', '#f6d23a', '#f6d23a'), filler('Cocosette', 'GALLETAS', '#c8202e', '#ffffff', '#ffffff')];
  const canTex = [['Diablitos', 'UNDERWOOD', '#f3efe4', '#c4231b'], ['Pirulín', '', '#c4231b', '#ffffff'], ['Mavesa', '', '#f5c518', '#1d3c8f']].map(o => ctex(256, 96, (c, w) => {
    c.fillStyle = o[2]; c.fillRect(0, 0, w, 96);
    [w * .25, w * .75].forEach(x => { fit(c, o[0], 'italic 700 34px ' + SERIF, o[3], x, o[1] ? 52 : 62, 120); if (o[1]) fit(c, o[1], '600 14px ' + SANS, o[3], x, 78, 120); });
  }));
  const canGeo = new CylinderGeometry(.04, .04, .1, 20), canTop = std('#b9bcbc', .35, { metalness: .7 });
  const canMats = canTex.map(t => [new MeshStandardMaterial({ map: t, roughness: .5 }), canTop, canTop]);
  function can(x: number, y: number, z: number, i: number) { const m = new Mesh(canGeo, canMats[i % 3]); m.position.set(x, y + .05, z); m.rotation.y = Math.PI * .5; m.castShadow = true; root.add(m); }

  // Shelves
  const wood = std('#a07850', .85), darkWood = std('#6e5236');
  box(5.1, 2.1, .04, darkWood, -.85, 1.25, -3.98);
  [-3.4, -1.65, .1, 1.7].forEach(x => box(.05, 2.1, .4, wood, x, 1.25, -3.8));
  [.5, .95, 1.4, 1.85].forEach(y => box(5.1, .03, .4, wood, -.85, y, -3.8));
  [.95, 1.4].forEach(y => { for (let k = 0; k < 13; k++) { const x = -3.28 + k * .128; addPack(harinaGeo, harinaMats, x, y + .015, -3.84, 'harina'); addPack(harinaGeo, harinaMats, x, y + .015, -3.72, 'harina', (k % 4 - 1.5) * .03); } });
  // Papelón: cones of raw cane sugar wrapped in dry leaves, two rows on the middle shelf.
  const papelonGeo = new CylinderGeometry(.05, .072, .17, 10), papelonMats = ['#4e2c10', '#5e3615', '#432509'].map(c => std(c, .85)), leafWrap = std('#a88b55', .95), tie = std('#d8c9a0', .9);
  for (let k = 0; k < 16; k++) { const x = -1.6 + (k % 8) * .155, z = k < 8 ? -3.86 : -3.71, p = new Mesh(papelonGeo, papelonMats[k % 3]); p.position.set(x, 1.5, z); p.rotation.y = k; p.castShadow = true; root.add(p);
    // Dry banana-leaf wrap around the lower half, tied with fibre.
    const w = new Mesh(new CylinderGeometry(.064, .076, .09, 10, 1, true), leafWrap); w.position.set(x, 1.46, z); w.castShadow = true; root.add(w);
    const t = new Mesh(new TorusGeometry(.066, .005, 4, 14), tie); t.rotation.x = Math.PI / 2; t.position.set(x, 1.49, z); root.add(t); }
  // Casabe: big thin cassava breads stacked on the top shelf.
  const casabeTex = ctex(256, 256, c => { c.fillStyle = '#e2c995'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(${120 + (i % 5) * 12},${78 + (i % 7) * 6},36,${.12 + (i % 4) * .06})`; c.beginPath(); c.arc((i * 97) % 256, (i * 53) % 256, 2 + (i % 6), 0, Math.PI * 2); c.fill(); } });
  const casabeGeo = new CylinderGeometry(.17, .17, .012, 28), casabeMat = new MeshStandardMaterial({ map: casabeTex, roughness: .95 });
  [-1.32, -.3].forEach(x => { for (let k = 0; k < 9; k++) { const c = new Mesh(casabeGeo, casabeMat); c.position.set(x + (k % 2 ? .01 : -.01), 1.875 + k * .015, -3.78); c.rotation.y = k; c.castShadow = true; root.add(c); } });
  // Malta: dark bottles with a red-and-gold label along the bottom shelf.
  const maltaLabel = ctex(256, 96, (c, w) => { c.fillStyle = '#b3201f'; c.fillRect(0, 0, w, 96); c.fillStyle = '#e8b93a'; c.fillRect(0, 10, w, 6); c.fillRect(0, 80, w, 6);
    [w * .25, w * .75].forEach(x => fit(c, 'MALTA', '800 34px ' + SANS, '#f6e3a0', x, 60, 110)); });
  const maltaGlass = new LatheGeometry([[0, 0], [.03, 0], [.032, .006], [.032, .12], [.026, .145], [.014, .18], [.013, .205], [0, .205]].map(p => new Vector2(p[0], p[1])), 18);
  const maltaBand = new CylinderGeometry(.0326, .0326, .07, 24, 1, true); maltaBand.translate(0, .07, 0);
  for (let k = 0; k < 24; k++) { const x = -.6 + (k % 12) * .19, z = k < 12 ? -3.86 : -3.7, g = new Group(); g.position.set(x, .515, z); g.rotation.y = k * 1.3;
    g.add(new Mesh(maltaGlass, std('#1d0f06', .1, { metalness: .15 }))); g.add(new Mesh(maltaBand, new MeshStandardMaterial({ map: maltaLabel, roughness: .6 }))); g.traverse(o => { o.castShadow = true; }); root.add(g); }
  const fGeo = new BoxGeometry(.16, .24, .1);
  for (let k = 0; k < 9; k++) addPack(fGeo, fillers[k % 4], -1.5 + k * .19, .965, -3.75, undefined, (k % 3 - 1) * .05);
  for (let k = 0; k < 14; k++) addPack(fGeo, fillers[(k + 2) % 4], -3.25 + k * .19, .515, -3.75);
  for (let k = 0; k < 16; k++) can(.25 + (k % 8) * .17, 1.415, -3.72 - (k > 7 ? .12 : 0), k);
  for (let k = 0; k < 10; k++) addPack(fGeo, fillers[(k + 1) % 4], -3.25 + k * .19, 1.865, -3.75);
  for (let k = 0; k < 8; k++) can(.4 + k * .17, 1.865, -3.75, k + 1);
  const plush = new Mesh(new SphereGeometry(.17, 32, 24), new MeshPhysicalMaterial({ color: '#cfe36f', roughness: .35, clearcoat: .6 }));
  plush.scale.y = .9; plush.position.set(-.85, 2.03, -3.75); plush.castShadow = true; root.add(plush);

  // Polarcitas: amber glass, painted Polar label from a photo, gold cap
  const glassGeo = new LatheGeometry([[0, 0], [.028, 0], [.03, .006], [.03, .11], [.026, .13], [.014, .16], [.012, .185], [.0135, .19], [0, .19]].map(p => new Vector2(p[0], p[1])), 18);
  const labelGeo = new CylinderGeometry(.0306, .0306, .075, 24, 1, true); labelGeo.translate(0, .068, 0);
  const capGeo = new CylinderGeometry(.0145, .0145, .012, 14); capGeo.translate(0, .196, 0);
  const polarImg = new Image();
  const labelTex = ctex(512, 186, (c, w, h) => {
    c.fillStyle = '#3a1a07'; c.fillRect(0, 0, w, h);
    if (polarImg.complete && polarImg.naturalWidth) { const lw = h * polarImg.naturalWidth / polarImg.naturalHeight; [w * .25, w * .75].forEach(x => c.drawImage(polarImg, x - lw / 2, 0, lw, h)); }
  });
  polarImg.onload = () => redraws.forEach(r => r());
  polarImg.src = '/materials/products/polar-label.jpg';
  const bottles: number[][] = [];
  [.35, .78, 1.21, 1.64].forEach(y => [-3.47, -3.6].forEach(z => { for (let k = 0; k < 11; k++) bottles.push([2.37 + k * .088, y, z]); }));
  for (let gx = 0; gx < 4; gx++) for (let gz = 0; gz < 3; gz++) bottles.push([3.02 + gx * .085, .32, .97 + gz * .085]);
  bottles.push([-3.12, .72, 1.55], [-2.9, .72, 1.38]);
  const placeBottles = (geo: LatheGeometry | CylinderGeometry, mat: Material) => {
    const m = new InstancedMesh(geo, mat, bottles.length), o = new Object3D();
    bottles.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.rotation.y = i * 1.7; o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.castShadow = true; root.add(keyed(m, 'polarcita'));
  };
  placeBottles(glassGeo, std('#3a1a07', .12, { metalness: .15 }));
  placeBottles(labelGeo, new MeshStandardMaterial({ map: labelTex, roughness: .6 }));
  placeBottles(capGeo, std('#d9b44a', .3, { metalness: .8 }));

  // Fridge
  const fridge = std('#e7ecea', .4, { metalness: .2 });
  box(1.2, .25, .7, fridge, 2.85, .125, -3.65); box(.06, 2, .7, fridge, 2.25, 1, -3.65); box(.06, 2, .7, fridge, 3.45, 1, -3.65);
  box(1.2, 2, .04, std('#f4f8f8', .3, { emissive: new Color('#dfefff'), emissiveIntensity: .35 }), 2.85, 1, -3.98);
  const headTex = ctex(512, 96, (c, w) => { c.fillStyle = '#c4312b'; c.fillRect(0, 0, w, 96); text(c, 'BIEN FRÍAS', '600 48px ' + SANS, '#ffffff', w / 2, 64); });
  box(1.2, .24, .72, [fridge, fridge, fridge, fridge, new MeshStandardMaterial({ map: headTex, emissive: '#ffffff', emissiveMap: headTex, emissiveIntensity: .5 }), fridge], 2.85, 2.12, -3.64);
  [.33, .76, 1.19, 1.62].forEach(y => box(1.12, .02, .62, std('#dfe7e9', .2, { metalness: .3 }), 2.85, y, -3.62));
  const glass = new Mesh(new PlaneGeometry(1.14, 1.86), new MeshStandardMaterial({ color: '#dff2f8', roughness: .05, transparent: true, opacity: .16 }));
  glass.position.set(2.85, 1.07, -3.29); glass.raycast = noRaycast; root.add(glass);
  box(.03, 1.86, .04, fridge, 2.85, 1.07, -3.28);

  // Counter with blue-and-white tiles
  const tileTex = ctex(128, 128, (c, w, h) => {
    c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2d6f9e'; c.lineWidth = 5; c.beginPath(); c.arc(64, 64, 30, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#2d6f9e'; [[0, 0], [128, 0], [0, 128], [128, 128]].forEach(p => { c.beginPath(); c.arc(p[0], p[1], 22, 0, Math.PI * 2); c.fill(); });
  }, [9, 3]);
  box(3.6, 1, .6, [wood, wood, wood, wood, new MeshStandardMaterial({ map: tileTex, roughness: .35 }), wood], 0, .5, -.9);
  box(3.72, .05, .7, std('#7c5a3a', .6), 0, 1.025, -.9);
  // The cash register is a CC0 scanned model, placed in Props.tsx.
  // Pan canilla: long soft loaves standing in a wicker basket at the end of the counter.
  const basket = new Mesh(new CylinderGeometry(.17, .13, .2, 20, 1, true), new MeshStandardMaterial({ color: '#a77b45', roughness: .95, side: DoubleSide })); basket.position.set(1.4, 1.15, -.92); basket.castShadow = true; root.add(basket);
  const loafMat = std('#d39a52', .75);
  for (let i = 0; i < 6; i++) { const a = i * 1.05, l = new Mesh(new CapsuleGeometry(.032, .42, 4, 10), loafMat); l.position.set(1.4 + Math.cos(a) * .06, 1.33, -.92 + Math.sin(a) * .06); l.rotation.set(Math.sin(a) * .22, 0, Math.cos(a) * .22); l.castShadow = true; root.add(l); }
  const jar = new Mesh(new CylinderGeometry(.1, .1, .24, 24), new MeshStandardMaterial({ color: '#ffffff', roughness: .05, transparent: true, opacity: .25 })); jar.position.set(-.35, 1.17, -.95); root.add(jar);
  ['#e23b5a', '#f2b33d', '#3aa8d8', '#6cc04a'].forEach((col, ci) => { for (let i = ci; i < 16; i += 4) { const cd = new Mesh(new SphereGeometry(.025, 10, 8), std(col, .3)); cd.position.set(-.35 + Math.cos(i * 2.4) * .05, 1.08 + Math.floor(i / 5) * .04, -.95 + Math.sin(i * 2.4) * .05); root.add(cd); } });
  keyed(box(.22, .016, .3, std('#2f5fa0', .7), .55, 1.058, -.85), 'libreta').rotation.y = .25;
  keyed(box(.2, .01, .28, std('#fbf8ee'), .55, 1.07, -.85), 'libreta').rotation.y = .25;
  beam([.48, 1.08, -.78], [.66, 1.08, -.92], .006, .006, std('#c4312b', .5));
  beam([.9, 0, -1.6], [.9, .72, -1.6], .03, .03, iron);
  const seat = new Mesh(new CylinderGeometry(.18, .18, .06, 20), std('#c4312b', .6)); seat.position.set(.9, .75, -1.6); seat.castShadow = true; root.add(seat);

  // Sidewalk: crates, the domino table and plastic chairs are CC0 scanned models (Props.tsx);
  // the dominoes and the chalkboard stay here.
  const domino = std('#fbfbf6', .4);
  for (let i = 0; i < 9; i++) box(.05, .012, .1, domino, -3.18 + (i % 5) * .07, .658, 1.32 + Math.floor(i / 5) * .2).rotation.y = (i % 3) * .4;
  const boardTex = ctex(300, 420, (c, w) => {
    c.fillStyle = '#22392f'; c.fillRect(0, 0, w, 420); text(c, 'ENCARGOS', '600 34px ' + SANS, '#f5e7a6', w / 2, 62);
    ['Web exprés', 'Web + tienda', 'App', 'Juego', 'Mundo 3D'].forEach((t, i) => text(c, t, 'italic 400 40px ' + SERIF, '#eef0e4', w / 2, 128 + i * 50));
    text(c, 'pregunte adentro →', '500 20px ' + SANS, '#cfd7c8', w / 2, 392);
  });
  const easel = new Group(); easel.position.set(2.05, 0, 1.85); easel.rotation.y = -.35;
  const face = new Mesh(new PlaneGeometry(.6, .84), new MeshStandardMaterial({ map: boardTex, roughness: .95 })); face.position.set(0, .55, .05); face.rotation.x = -.17; face.castShadow = true; easel.add(keyed(face, 'pizarra'));
  const frame = std('#8a6b47', .8);
  box(.66, .05, .03, frame, 0, .98, -.02, easel); box(.66, .05, .03, frame, 0, .12, .13, easel);
  box(.04, .9, .03, frame, -.32, .55, .05, easel).rotation.x = -.17; box(.04, .9, .03, frame, .32, .55, .05, easel).rotation.x = -.17;
  const back = new Mesh(new PlaneGeometry(.6, .84), frame); back.position.set(0, .55, -.12); back.rotation.x = .17; back.castShadow = true; easel.add(back);
  root.add(easel);

  // Beer-calendar style poster, an original illustration
  const posterTex = ctex(360, 540, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h * .62); g.addColorStop(0, '#f7c35a'); g.addColorStop(1, '#ea7f3d'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff0c4'; c.beginPath(); c.arc(262, 250, 64, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1f6f8b'; c.fillRect(0, h * .6, w, h * .4); c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) c.fillRect(0, h * .6 + 10 + i * 16, w, 2);
    c.fillStyle = '#e9d3a1'; c.beginPath(); c.moveTo(0, h * .86); c.quadraticCurveTo(w * .5, h * .8, w, h * .88); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.strokeStyle = '#2a3b2e'; c.lineWidth = 10; c.beginPath(); c.moveTo(40, h * .9); c.quadraticCurveTo(60, 300, 30, 150); c.stroke();
    c.fillStyle = '#2a3b2e'; for (let i = 0; i < 7; i++) { c.save(); c.translate(30, 150); c.rotate(-2.6 + i * .62); c.beginPath(); c.ellipse(52, 0, 56, 11, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    const skin = '#b97a4f', suit = '#d62b3a';
    c.fillStyle = '#2b1a12'; c.beginPath(); c.ellipse(186, 236, 30, 56, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = skin;
    c.beginPath(); c.moveTo(172, 372); c.lineTo(160, 488); c.lineTo(176, 490); c.lineTo(186, 380); c.fill();
    c.beginPath(); c.moveTo(198, 372); c.lineTo(214, 486); c.lineTo(230, 484); c.lineTo(212, 370); c.fill();
    c.fillRect(178, 224, 16, 30);
    c.beginPath(); c.moveTo(208, 262); c.lineTo(240, 226); c.lineTo(248, 186); c.lineTo(238, 184); c.lineTo(230, 220); c.lineTo(202, 250); c.fill();
    c.beginPath(); c.moveTo(162, 262); c.lineTo(150, 330); c.lineTo(160, 332); c.lineTo(172, 270); c.fill();
    c.fillStyle = '#5a2a10'; c.fillRect(236, 140, 13, 46); c.fillRect(239, 128, 7, 14); c.fillStyle = '#f4efe2'; c.fillRect(236, 158, 13, 12);
    c.fillStyle = suit; c.beginPath(); c.moveTo(166, 254); c.lineTo(208, 254); c.quadraticCurveTo(214, 300, 200, 318); c.quadraticCurveTo(214, 350, 214, 376); c.lineTo(168, 378); c.quadraticCurveTo(164, 350, 176, 318); c.quadraticCurveTo(160, 300, 166, 254); c.fill();
    c.fillStyle = '#f3e2b8'; c.beginPath(); c.moveTo(166, 350); c.lineTo(220, 356); c.lineTo(232, 440); c.lineTo(176, 430); c.fill();
    c.strokeStyle = suit; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(170 + i * 4, 372 + i * 18); c.lineTo(222 + i * 2, 378 + i * 18); c.stroke(); }
    c.fillStyle = skin; c.beginPath(); c.arc(186, 212, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f3e2b8'; c.beginPath(); c.ellipse(186, 196, 44, 9, -.12, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(186, 186, 20, 14, 0, Math.PI, 0); c.fill(); c.fillStyle = suit; c.fillRect(166, 189, 40, 5);
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 6; text(c, '¡Bien fría!', 'italic 400 64px ' + SERIF, '#ffffff', w / 2, 86); c.shadowBlur = 0;
    c.fillStyle = '#fbf3df'; c.fillRect(0, h - 56, w, 56); text(c, 'CALENDARIO 2026', '600 18px ' + SANS, '#1d3c8f', w / 2, h - 30); text(c, 'Playa · sol · cervecita', '500 14px ' + SANS, '#c4312b', w / 2, h - 12);
    c.strokeStyle = '#ffffff'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
  });
  plane(.66, .99, new MeshStandardMaterial({ map: posterTex, roughness: .7 }), -3, 1.8, .02);

  // A mango tree throws dappled shade on the whitewashed wall next door
  // Kept to the right of the facade so its canopy frames the sign instead of covering it.
  root.add(createMangoTree(6.8, 2.8, 23, .72));

  // Whitewashed house next door
  const cal = std('#f3f1ea', .95), calTrim = std('#e7e2d6', .95), shutter = std('#3a8e86', .7);
  box(5.4, 3.4, 4.2, cal, 6.85, 1.7, -2.1); box(5.6, .22, 4.4, calTrim, 6.85, 3.5, -2.1);
  box(5.42, .42, .03, std('#7fb3c9'), 6.85, .21, .01);
  [5.45, 8.3].forEach(x => {
    box(.9, 1.15, .06, std('#23312f', .8), x, 1.85, .02);
    [-1, 1].forEach(sd => { const g = new Group(); g.position.set(x + sd * .23, 1.85, .07); box(.44, 1.15, .04, shutter, 0, 0, 0, g); for (let i = 0; i < 7; i++) box(.4, .05, .04, shutter, 0, -.45 + i * .15, .03, g).rotation.x = .35; root.add(g); });
    box(1.1, .08, .18, calTrim, x, 1.24, .09);
  });
  box(.95, 2.15, .06, std('#2d6f9e', .6), 6.9, 1.08, .02); box(1.15, .1, .2, calTrim, 6.9, 2.2, .08);

  // Clothesline in a strong wind
  const postWood = std('#9a7a55', .85), pinMat = std('#c9a56f', .8);
  beam([5.15, 0, 1.3], [5.15, 2.34, 1.3], .05, .045, postWood); beam([9.35, 0, 1.3], [9.35, 2.34, 1.3], .05, .045, postWood);
  beam([5.15, 2.2, 1.3], [9.35, 2.2, 1.3], .008, .008, std('#ddd6c6', .8));
  const cloths = [createCloth({ cx: 5.85, cz: 1.3, topY: 2.18, w: 1.1, h: 1.35, color: '#2e8d86' }), createCloth({ cx: 7.25, cz: 1.3, topY: 2.18, w: 1.1, h: 1.45, color: '#c4dceb' }), createCloth({ cx: 8.65, cz: 1.3, topY: 2.18, w: 1.05, h: 1.3, color: '#d3e8d9' })];
  for (const c of cloths) { root.add(c.mesh); c.pinTops.forEach(p => box(.03, .09, .04, pinMat, p[0], p[1] + .01, p[2] + .02)); }
  const advanceCloth = createClothSet(cloths, 8);

  plush.userData.dynamic=true;
  cloths.forEach(c=>{c.mesh.userData.dynamic=true;});
  instanceRepeated(root);batchStatic(root);
  if (document.fonts) document.fonts.ready.then(() => redraws.forEach(r => r()));
  let t = 0;
  return {
    group: root,
    update(dt: number, animate: boolean) {
      if (!animate) return;
      t += dt; advanceCloth(dt);
      plush.scale.set(1 + Math.sin(t * 2.2) * .03, .9 - Math.sin(t * 2.2) * .03, 1);
    },
  };
}

export function Bodega({ onSelect }: { onSelect: (key: string) => void }) {
  const world = useMemo(buildBodega, []);
  useFrame(({camera}, dt) => world.update(Math.min(dt, .05), !journey.paused && !journey.reduced && simulationVisible(camera,world.group.position,10)));
  const keyOf = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.object.userData.key as string | undefined;
  return <primitive object={world.group}
    onClick={(e: ThreeEvent<MouseEvent>) => { const k = keyOf(e); if (k) { e.stopPropagation(); onSelect(k); } }}
    onPointerMove={(e: ThreeEvent<PointerEvent>) => { document.body.style.cursor = keyOf(e) ? 'pointer' : 'auto'; }}
    onPointerOut={() => { document.body.style.cursor = 'auto'; }} />;
}

// The village plaza in front of the bodega: stone paving, benches, a street lamp, a big mango tree
// and colonial houses closing the north and south sides.
export function Pueblo() {
  const plaza = useMemo(() => {
    const g = new Group();
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d')!;
    c.fillStyle = '#cbbfa6'; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = `hsl(${36 + (x * 7 + y * 3) % 8},${18 + (x + y) % 3 * 4}%,${70 + (x * 5 + y * 11) % 9}%)`; c.fillRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28); }
    const tex = new CanvasTexture(cv); tex.colorSpace = SRGBColorSpace; tex.wrapS = tex.wrapT = RepeatWrapping; tex.repeat.set(3.4, 6.2);
    // Cobbled plaza floor from a CC0 set, about 1.6 m per texture repeat.
    void tex; const pave = new Mesh(new PlaneGeometry(6.9, 12.6), applyPbr(new MeshStandardMaterial({ color: new Color(1.15, 1.08, .98) }), 'cobblestone_square', { repeat: [6.9 / 1.6, 12.6 / 1.6] })); pave.rotation.x = -Math.PI / 2; pave.position.set(12.9, .1, 9.2); pave.receiveShadow = true; g.add(pave);
    const wood = new MeshStandardMaterial({ color: '#8a6440', roughness: .85 }), iron = new MeshStandardMaterial({ color: '#26302e', roughness: .5, metalness: .5 });
    // Plaza benches are CC0 scanned models (Props.tsx).
    // The plaza lamp is now a scanned wall lantern on the bodega facade (Props.tsx).
    g.add(createMangoTree(10.8, 14.2, 41, .8, [15.5, 11.3, 1.6, 3.2])); // keep fruit clear of the raspado cart's parasol
    return g;
  }, []);
  return <>
    <primitive object={plaza} />
    <ColonialHouse position={[16.5, 0, 2.5]} width={6} depth={5} wall="#f3ead8" windows={[-1.7, 1.7]} doorX={0} seed={3} />
    <ColonialHouse position={[13, 0, 15.6]} rotation={Math.PI} width={6} depth={5} wall="#f4dcc2" zocalo="#2e6f6a" door="#2f6f9e" windows={[-1.7, 1.7]} bougainvillea seed={8} />
  </>;
}


