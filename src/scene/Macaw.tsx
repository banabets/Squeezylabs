import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, CapsuleGeometry, Color, ConeGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshDepthMaterial, MeshStandardMaterial, PlaneGeometry, RGBADepthPacking, SRGBColorSpace, SphereGeometry, Vector2, type Object3D } from 'three';
import { journey } from '../data/journey';

// Venezuelan macaws, built to match the realistic world: scalloped plumage, the bare white face with
// its fine feather lines, a hooked beak, folded wings with the real color bands, a long feather tail
// and zygodactyl feet. Two species: the guacamaya bandera (scarlet) and the azul y amarilla.
// Units are meters; a bird is about 85 cm from crown to tail tip, standing on y = 0 and facing +z.
type Species = { body: string; chest: string; back: string; head: string; forehead: string; shoulder: string; band: string; flight: string; tail: string; tailTip: string; upperBeak: string; faceLines: string; collar?: string };
const SCARLET: Species = { body: '#c4162a', chest: '#c4162a', back: '#b8142a', head: '#cc1c2c', forehead: '#cc1c2c', shoulder: '#c4162a', band: '#f3b51a', flight: '#1f4fb0', tail: '#bc1428', tailTip: '#2a5cc0', upperBeak: '#eadfca', faceLines: '#e7c9c2' };
const BLUEGOLD: Species = { body: '#1d6fc0', chest: '#f2a614', back: '#1a68b8', head: '#1d6fc0', forehead: '#4fa83a', shoulder: '#1d78c8', band: '#1b62b0', flight: '#163f8c', tail: '#1a64b4', tailTip: '#14448c', upperBeak: '#1c1c1c', faceLines: '#1e1e1e', collar: '#151515' };

const noRaycast = (o: Object3D) => o.traverse(c => { c.raycast = () => {}; });
const tex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => { const el = document.createElement('canvas'); el.width = w; el.height = h; draw(el.getContext('2d')!); const t = new CanvasTexture(el); t.colorSpace = SRGBColorSpace; t.anisotropy = 8; return t; };

// Contour feathers: overlapping scallops with a light edge, drawn over a body color layout.
function scallops(c: CanvasRenderingContext2D, w: number, h: number, size: number) {
  for (let y = -size; y < h + size; y += size * .7) for (let x = ((y / (size * .7)) % 2) * size * .5; x < w + size; x += size) {
    c.strokeStyle = 'rgba(0,0,0,.13)'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, size * .55, .1 * Math.PI, .9 * Math.PI); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.arc(x, y - 2, size * .5, .15 * Math.PI, .85 * Math.PI); c.stroke();
  }
}
// Body texture: u wraps around the lathe (u = 0 faces forward), v runs from vent to neck.
function bodyTexture(s: Species) {
  return tex(512, 512, c => {
    const g = c.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, s.chest); g.addColorStop(.18, s.chest); g.addColorStop(.32, s.back); g.addColorStop(.68, s.back); g.addColorStop(.82, s.chest); g.addColorStop(1, s.chest);
    c.fillStyle = g; c.fillRect(0, 0, 512, 512);
    if (s.collar) { c.fillStyle = s.collar; c.fillRect(0, 0, 512, 34); }
    scallops(c, 512, 512, 22);
  });
}
function headTexture(s: Species) {
  return tex(512, 256, c => {
    c.fillStyle = s.head; c.fillRect(0, 0, 512, 256);
    // Sphere UVs: v = 0 is the crown. Forehead tint at the front top.
    const g = c.createRadialGradient(0, 40, 4, 0, 40, 110); g.addColorStop(0, s.forehead); g.addColorStop(1, s.head + '00');
    c.fillStyle = g; c.fillRect(0, 0, 512, 256); const g2 = c.createRadialGradient(512, 40, 4, 512, 40, 110); g2.addColorStop(0, s.forehead); g2.addColorStop(1, s.head + '00'); c.fillStyle = g2; c.fillRect(0, 0, 512, 256);
    scallops(c, 512, 256, 14);
  });
}
// Bare facial patch: white skin with rows of tiny feather lines.
function faceTexture(s: Species) {
  return tex(256, 256, c => {
    c.clearRect(0, 0, 256, 256);
    const g = c.createRadialGradient(128, 128, 60, 128, 128, 128); g.addColorStop(0, '#f6f2ea'); g.addColorStop(.85, '#efe8dc'); g.addColorStop(1, 'rgba(239,232,220,0)');
    c.fillStyle = g; c.beginPath(); c.arc(128, 128, 128, 0, 7); c.fill();
    c.strokeStyle = s.faceLines; c.lineWidth = 3; c.lineCap = 'round';
    for (let r = 0; r < 4; r++) for (let k = 0; k < 9; k++) { const x = 40 + k * 20 + (r % 2) * 10, y = 70 + r * 32; if (Math.hypot(x - 128, y - 128) > 100) continue; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10, y + 3); c.stroke(); }
  });
}
// Folded wing: shoulder feathers, a covert band and long flight feathers, top to bottom.
function wingTexture(s: Species) {
  return tex(256, 512, c => {
    c.fillStyle = s.flight; c.fillRect(0, 0, 256, 512);
    const rows: [number, number, number, string][] = [[0, .2, 18, s.shoulder], [.16, .42, 26, s.band], [.36, .62, 34, s.flight], [.55, 1, 48, s.flight]];
    rows.forEach(([y0, y1, fw, col]) => {
      for (let x = -fw; x < 256 + fw; x += fw * .6) {
        const g = c.createLinearGradient(0, y0 * 512, 0, y1 * 512); g.addColorStop(0, col); g.addColorStop(1, new Color(col).multiplyScalar(.7).getStyle());
        c.fillStyle = g; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, y0 * 512); c.quadraticCurveTo(x + fw * .6, (y0 + y1) * 256, x + fw * .2, y1 * 512); c.quadraticCurveTo(x - fw * .3, (y0 + y1) * 256, x, y0 * 512); c.fill(); c.stroke();
      }
    });
    if (s === SCARLET) { c.fillStyle = 'rgba(80,150,60,.35)'; c.fillRect(0, .36 * 512, 256, 20); }
  });
}
// Long feather with alpha: vane on both sides of a pale rachis.
let featherAlpha: CanvasTexture | undefined;
const feather = () => featherAlpha ??= tex(64, 512, c => {
  c.clearRect(0, 0, 64, 512); c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(32, 512); c.bezierCurveTo(66, 380, 60, 60, 32, 0); c.bezierCurveTo(4, 60, -2, 380, 32, 512); c.fill();
  c.globalCompositeOperation = 'source-atop';
  for (let y = 0; y < 512; y += 4) { c.strokeStyle = `rgba(0,0,0,${.05 + (y % 12 === 0 ? .08 : 0)})`; c.beginPath(); c.moveTo(32, y); c.lineTo(0, y - 18); c.moveTo(32, y); c.lineTo(64, y - 18); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,240,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(32, 512); c.lineTo(32, 0); c.stroke();
});

const featherGeo = (() => { const g = new PlaneGeometry(1, 1, 1, 6); g.translate(0, -.5, 0); return g; })();
const featherDepth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: feather(), alphaTest: .5, side: DoubleSide });
const featherMats = new Map<string, MeshStandardMaterial>();
const featherMat = (color: string) => { let m = featherMats.get(color); if (!m) { m = new MeshStandardMaterial({ map: feather(), color, alphaTest: .5, side: DoubleSide, roughness: .6 }); featherMats.set(color, m); } return m; };
function featherCard(color: string, length: number, width: number) { const m = new Mesh(featherGeo, featherMat(color)); m.scale.set(width, length, 1); m.customDepthMaterial = featherDepth; m.castShadow = true; return m; }

// Body silhouette: plump chest, narrowing to the vent and the neck.
const bodyGeo = (() => { const pts: Vector2[] = []; for (let i = 0; i <= 28; i++) { const t = i / 28; pts.push(new Vector2(Math.pow(Math.sin(Math.PI * t), .75) * .085 * (1 - .25 * t) + .001, t * .3)); } return new LatheGeometry(pts, 40); })();
const beakGeo = (() => { const g = new ConeGeometry(.034, .09, 24, 10), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + .045; p.setZ(i, p.getZ(i) - y * y * 5); } g.computeVertexNormals(); return g; })();

export function createMacaw(s: Species, flying = false) {
  const root = new Group(), bird = new Group(); root.add(bird);
  const plumage = new MeshStandardMaterial({ map: bodyTexture(s), roughness: .72 });
  const headMat = new MeshStandardMaterial({ map: headTexture(s), roughness: .72 });
  const wingMat = new MeshStandardMaterial({ map: wingTexture(s), roughness: .65 });
  // Perched birds lean forward a little; flying birds lie along +z.
  bird.position.y = flying ? 0 : .07; bird.rotation.x = flying ? Math.PI / 2 - .1 : .32;
  const body = new Mesh(bodyGeo, plumage); body.castShadow = true; bird.add(body);
  const head = new Group(); head.position.set(0, .33, .02); bird.add(head);
  if (flying) head.rotation.x = -1.2;
  const skull = new Mesh(new SphereGeometry(.062, 32, 24), headMat); skull.scale.set(1, 1.05, 1.12); skull.castShadow = true; head.add(skull);
  const faceMat = new MeshStandardMaterial({ map: faceTexture(s), transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2 });
  [-1, 1].forEach(side => {
    // Patch centered about 35 degrees off the beak on each side (SphereGeometry: phi = PI/2 faces +z).
    const f = new Mesh(new SphereGeometry(.0635, 24, 16, Math.PI / 2 + side * .85 - .34, .68, Math.PI * .34, Math.PI * .3), faceMat); f.scale.set(1, 1.05, 1.12); head.add(f);
    const eye = new Mesh(new SphereGeometry(.011, 12, 8), new MeshStandardMaterial({ color: '#f0e3a0', roughness: .2 })); eye.position.set(side * .052, .012, .03); head.add(eye);
    const pupil = new Mesh(new SphereGeometry(.006, 10, 8), new MeshStandardMaterial({ color: '#080808', roughness: .1 })); pupil.position.set(side * .061, .013, .033); head.add(pupil);
  });
  const upper = new Mesh(beakGeo, new MeshStandardMaterial({ color: s.upperBeak, roughness: .35 })); upper.rotation.x = Math.PI / 2 + .55; upper.position.set(0, -.012, .075); upper.castShadow = true; head.add(upper);
  const tip = new Mesh(new SphereGeometry(.012, 10, 8), new MeshStandardMaterial({ color: '#1a1a1a', roughness: .4 })); tip.position.set(0, -.06, .1); head.add(tip);
  const lower = new Mesh(new SphereGeometry(.018, 16, 12), new MeshStandardMaterial({ color: '#181818', roughness: .5 })); lower.scale.set(1, .7, 1.2); lower.position.set(0, -.045, .058); head.add(lower);
  if (s.collar) { const c = new Mesh(new SphereGeometry(.03, 12, 8), new MeshStandardMaterial({ color: s.collar, roughness: .8 })); c.scale.set(1.2, .45, .6); c.position.set(0, -.065, .045); head.add(c); }

  const wings: Group[] = [];
  [-1, 1].forEach(side => {
    const w = new Group(); w.position.set(side * .07, .24, -.01); bird.add(w); wings.push(w);
    if (!flying) {
      const m = new Mesh(new SphereGeometry(.5, 32, 24), wingMat); m.scale.set(.045, .36, .13); m.position.set(side * -.004, -.1, -.035); m.rotation.x = .18; m.castShadow = true; w.add(m);
      for (let k = 0; k < 4; k++) { const f = featherCard(s.flight, .2, .045); f.position.set(side * .004, -.22, -.06 - k * .01); f.rotation.set(.3, Math.PI / 2, 0); w.add(f); }
    } else {
      // Open wing: coverts near the body, then fanned primaries.
      for (let k = 0; k < 9; k++) {
        const f = featherCard(k < 3 ? s.band : s.flight, .24 + k * .025, .07); const along = .05 + k * .045;
        f.position.set(side * along, -.02 - k * .006, 0); f.rotation.set(0, 0, side * (Math.PI / 2 - .1 - k * .045)); w.add(f);
      }
      const cov = new Mesh(new SphereGeometry(.5, 24, 16), wingMat); cov.scale.set(.3, .12, .02); cov.position.set(side * .15, -.03, 0); cov.castShadow = true; w.add(cov);
    }
  });
  // Tail: two long central feathers over shorter ones, blue-tipped on the scarlet.
  const tail = new Group(); tail.position.set(0, .02, -.03); tail.rotation.x = .22; bird.add(tail);
  for (let k = 0; k < 6; k++) { const center = k === 2 || k === 3, f = featherCard(k % 2 ? s.tail : s.tailTip, center ? .5 : .36 - Math.abs(k - 2.5) * .03, .055); f.position.set((k - 2.5) * .014, 0, -k * .002); f.rotation.z = (k - 2.5) * .05; tail.add(f); }
  if (!flying) {
    const toe = new MeshStandardMaterial({ color: '#4a4846', roughness: .6 });
    [-1, 1].forEach(side => { for (let k = 0; k < 4; k++) { const t = new Mesh(new CapsuleGeometry(.008, .035, 4, 8), toe); t.position.set(side * .03 + (k % 2 ? .008 : -.008), .02, k < 2 ? .022 : -.022); t.rotation.x = k < 2 ? 1.1 : -1.1; root.add(t); } });
  }
  noRaycast(root);
  return { root, bird, head, wings, tail };
}

export function Macaws() {
  const { group, perched, flyers } = useMemo(() => {
    const group = new Group();
    const perched = [{ ...createMacaw(SCARLET), x: -1.05, ph: 0 }, { ...createMacaw(BLUEGOLD), x: -.5, ph: 2.1 }];
    perched.forEach(p => { p.root.position.set(p.x, 3.73, 3.8); p.root.rotation.y = .25; p.root.scale.setScalar(1.15); group.add(p.root); });
    const flyers = [createMacaw(SCARLET, true), createMacaw(BLUEGOLD, true)].map((m, i) => { m.root.scale.setScalar(1.3); group.add(m.root); return { ...m, i }; });
    return { group, perched, flyers };
  }, []);
  const time = useRef(0);
  useFrame((_, dt) => {
    if (!journey.paused && !journey.reduced) time.current += Math.min(dt, .05);
    const t = time.current;
    perched.forEach(p => {
      p.head.rotation.y = Math.sin(t * .9 + p.ph) * .6 * Math.max(0, Math.sin(t * .35 + p.ph));
      p.head.rotation.z = Math.max(0, Math.sin(t * .5 + p.ph * 2)) * .3;
      p.tail.rotation.z = Math.sin(t * 1.3 + p.ph) * .04;
      // Now and then one stretches a wing.
      const stretch = Math.max(0, Math.sin(t * .23 + p.ph * 3) - .92) * 8;
      p.wings.forEach((w, k) => { w.rotation.z = (k ? -1 : 1) * stretch * .5; });
    });
    flyers.forEach(f => {
      const a = t * .18 + f.i * .5, x = 15 + Math.cos(a) * 9, z = 6 + Math.sin(a) * 7;
      f.root.position.set(x + f.i * .9, 7 + Math.sin(t * .8 + f.i) * .4, z + f.i * .6);
      f.root.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a) * .78), Math.sin(t * .6 + f.i) * .15);
      const flap = Math.sin(t * 6.5 + f.i);
      f.wings.forEach((w, k) => { w.rotation.y = (k ? -1 : 1) * flap * .55; });
      f.tail.rotation.x = .1 + Math.sin(t * 6.5 + f.i + 1) * .05;
    });
  });
  return <primitive object={group} />;
}
