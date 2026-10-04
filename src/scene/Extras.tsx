import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture, CatmullRomCurve3, CircleGeometry, Color, ConeGeometry, DoubleSide, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshStandardMaterial,
  Object3D, RepeatWrapping, SphereGeometry, Sprite, SpriteMaterial, SRGBColorSpace, TubeGeometry, Vector3, BoxGeometry,
} from 'three';
import { journey } from '../data/journey';
import { mainPoint } from '../data/world';
import { rng } from './Mango';
import { sky } from './daylight';

const moving = () => !journey.paused && !journey.reduced;
const noRaycast = () => {};
const inVillage = (x: number, z: number) => x > 8.5 && z > -4 && z < 22;

// Gulls and pelicans circling the island; gulls flap, pelicans mostly glide.
export function Birds() {
  const { group, birds } = useMemo(() => {
    const group = new Group(), R = rng(31), birds: { g: Group; l: Group; r: Group; rad: number; h: number; speed: number; phase: number; pelican: boolean }[] = [];
    const gull = new MeshStandardMaterial({ color: '#f4f4ef', roughness: .8 }), gullWing = new MeshStandardMaterial({ color: '#d9dcdc', roughness: .8 }), pel = new MeshStandardMaterial({ color: '#8a7f72', roughness: .9 });
    for (let i = 0; i < 11; i++) {
      const pelican = i < 3, s = pelican ? 1.8 : 1, g = new Group();
      const body = new Mesh(new SphereGeometry(.12, 10, 8), pelican ? pel : gull); body.scale.set(1, .8, 2.4); g.add(body);
      const l = new Group(), r = new Group();
      const wingGeo = new BoxGeometry(.75, .015, .2); wingGeo.translate(.37, 0, 0);
      l.add(new Mesh(wingGeo, pelican ? pel : gullWing)); r.add(new Mesh(wingGeo, pelican ? pel : gullWing)); r.rotation.y = Math.PI;
      g.add(l, r); g.scale.setScalar(s); group.add(g);
      birds.push({ g, l, r, rad: 16 + R() * 14, h: 9 + R() * 8, speed: (.1 + R() * .06) * (i % 2 ? 1 : -1), phase: R() * 6.28, pelican });
    }
    return { group, birds };
  }, []);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (moving()) t.current += Math.min(dt, .05);
    for (const b of birds) {
      const a = b.phase + t.current * b.speed, x = 6 + Math.cos(a) * b.rad, z = 8 + Math.sin(a) * b.rad * .8, y = b.h + Math.sin(t.current * .4 + b.phase) * 1.2;
      b.g.position.set(x, y, z);
      b.g.rotation.set(0, -a + (b.speed > 0 ? 0 : Math.PI), (b.speed > 0 ? 1 : -1) * .25);
      const flap = b.pelican ? Math.sin(t.current * 3 + b.phase) * .12 * (Math.sin(t.current * .5 + b.phase) > .6 ? 1 : .15) : Math.sin(t.current * 7 + b.phase) * .45;
      b.l.rotation.z = flap; b.r.rotation.z = -flap;
    }
  });
  return <primitive object={group} />;
}

// A brown pelican resting on a dock piling.
export function Pelican({ position }: { position: [number, number, number] }) {
  const g = useMemo(() => {
    const g = new Group(), body = new MeshStandardMaterial({ color: '#7d7266', roughness: .9 }), head = new MeshStandardMaterial({ color: '#f1ece0', roughness: .8 }), beak = new MeshStandardMaterial({ color: '#c9a25a', roughness: .6 });
    const b = new Mesh(new SphereGeometry(.22, 14, 10), body); b.scale.set(1, .9, 1.6); b.position.y = .26; b.rotation.x = -.3; g.add(b);
    const neck = new Mesh(new SphereGeometry(.08, 10, 8), head); neck.scale.set(1, 2.6, 1); neck.position.set(0, .52, .2); g.add(neck);
    const h = new Mesh(new SphereGeometry(.09, 10, 8), head); h.position.set(0, .72, .26); g.add(h);
    const bk = new Mesh(new ConeGeometry(.045, .5, 8), beak); bk.rotation.x = Math.PI / 2 + .5; bk.position.set(0, .6, .5); g.add(bk);
    g.traverse(o => { o.castShadow = true; });
    return g;
  }, []);
  return <primitive object={g} position={position} rotation={[0, 2.3, 0]} />;
}

// Shells, a line of dry seaweed at the high-tide mark and a trail of footprints toward the water.
export function BeachDetails() {
  const g = useMemo(() => {
    const g = new Group(), R = rng(5), o = new Object3D();
    const shellCols = ['#f3e6d4', '#e9c9b6', '#f6efe3', '#d9b8a0'].map(h => new Color(h));
    const shells = new InstancedMesh(new SphereGeometry(.05, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new MeshStandardMaterial({ roughness: .5 }), 220);
    let n = 0;
    while (n < 220) { const [x, z] = mainPoint(R() * 6.283, .8 + R() * .09); if (inVillage(x, z)) continue; o.position.set(x, .06, z); o.rotation.set(0, R() * 6, 0); o.scale.set(1 + R(), .5 + R() * .4, 1.3 + R()); o.updateMatrix(); shells.setMatrixAt(n, o.matrix); shells.setColorAt(n, shellCols[n % 4]); n++; }
    shells.receiveShadow = true; g.add(shells);
    const weed = new InstancedMesh(new IcosahedronGeometry(.12, 0), new MeshStandardMaterial({ roughness: 1 }), 520), weedCols = ['#4a3e26', '#5b4a2c', '#3e3a24', '#6a5a36'].map(h => new Color(h));
    n = 0;
    for (let i = 0; i < 1400 && n < 520; i++) { const a = i / 1400 * 6.283; if (Math.sin(a * 9) + Math.sin(a * 23) < -.3) continue; const [x, z] = mainPoint(a, .885 + Math.sin(a * 41) * .006); if (inVillage(x, z)) continue; o.position.set(x, .045, z); o.rotation.set(0, R() * 6, 0); o.scale.set(1 + R() * 1.5, .18, .5 + R() * .6); o.updateMatrix(); weed.setMatrixAt(n, o.matrix); weed.setColorAt(n, weedCols[n % 4]); n++; }
    weed.count = n; weed.receiveShadow = true; g.add(weed);
    const prints = new InstancedMesh(new CircleGeometry(.06, 10), new MeshStandardMaterial({ color: '#b7a07a', roughness: 1, transparent: true, opacity: .55, polygonOffset: true, polygonOffsetFactor: -2 }), 40);
    for (let i = 0; i < 40; i++) {
      const t = .72 + i / 40 * .17, a = 1.42 + Math.sin(i * .35) * .025, [x, z] = mainPoint(a, t), side = i % 2 ? 1 : -1, shore = Math.max(0, (t - .88) / .12);
      o.position.set(x + side * .12, .085 - Math.pow(shore, 1.5) * 1.05, z); o.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2); o.scale.set(1, 2.1, 1); o.updateMatrix(); prints.setMatrixAt(i, o.matrix);
    }
    g.add(prints);
    for (const m of [shells, weed, prints]) m.raycast = noRaycast;
    return g;
  }, []);
  return <primitive object={g} />;
}

// Striped hammock slung between two palm trunks, swaying.
export function Hammock({ a, b }: { a: [number, number, number]; b: [number, number, number] }) {
  const ref = useRef<Mesh>(null), t = useRef(0);
  const { geo, mat, pivot, axis } = useMemo(() => {
    const A = new Vector3(...a), B = new Vector3(...b), mid = A.clone().lerp(B, .5); mid.y -= 1;
    const curve = new CatmullRomCurve3([A, A.clone().lerp(mid, .5).setY((A.y + mid.y) / 2 - .15), mid, B.clone().lerp(mid, .5).setY((B.y + mid.y) / 2 - .15), B]);
    const geo = new TubeGeometry(curve, 40, .28, 12, false); geo.scale(1, .55, 1);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d')!;
    ['#d62b3a', '#f2c14e', '#2d6f9e', '#3e9a95', '#f4efe2'].forEach((col, i) => { c.fillStyle = col; c.fillRect(i * 256 / 5, 0, 256 / 5, 64); });
    const tex = new CanvasTexture(cv); tex.colorSpace = SRGBColorSpace; tex.wrapS = tex.wrapT = RepeatWrapping; tex.repeat.set(1, 6);
    return { geo, mat: new MeshStandardMaterial({ map: tex, roughness: .9, side: DoubleSide }), pivot: A.clone().lerp(B, .5), axis: B.clone().sub(A).normalize() };
  }, [a.join(), b.join()]);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (moving()) t.current += Math.min(dt, .05);
    ref.current.position.copy(pivot).negate().applyAxisAngle(axis, Math.sin(t.current * 1.1) * .12).add(pivot);
    ref.current.quaternion.setFromAxisAngle(axis, Math.sin(t.current * 1.1) * .12);
  });
  return <mesh ref={ref} geometry={geo} material={mat} castShadow receiveShadow />;
}

// Distant cumulus billboards, tinted by the time of day.
export function CloudBank() {
  const { group, mats } = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c = cv.getContext('2d')!, R = rng(3);
    for (let i = 0; i < 26; i++) {
      const x = 90 + R() * 330, y = 110 + R() * 70 - (Math.abs(x - 256) < 120 ? 50 : 0), r = 40 + R() * 60, gr = c.createRadialGradient(x, y - r * .3, r * .1, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.6, 'rgba(240,244,248,.75)'); gr.addColorStop(1, 'rgba(220,228,236,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill();
    }
    const g = c.createLinearGradient(0, 150, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.fillRect(0, 150, 512, 106);
    const tex = new CanvasTexture(cv); tex.colorSpace = SRGBColorSpace;
    const group = new Group(), mats: SpriteMaterial[] = [];
    for (let i = 0; i < 11; i++) {
      const m = new SpriteMaterial({ map: tex, fog: false, depthWrite: false, transparent: true, opacity: .92 }), s = new Sprite(m), a = i / 11 * 6.283 + R() * .4, r = 230 + R() * 80;
      s.position.set(Math.cos(a) * r, 40 + R() * 35, Math.sin(a) * r); const w = 90 + R() * 80; s.scale.set(w, w * .5, 1); group.add(s); mats.push(m);
    }
    return { group, mats };
  }, []);
  const white = new Color(1, 1, 1), tint = new Color();
  useFrame(() => { tint.copy(white).lerp(sky.sunColor, .35 + sky.warmth.value * .3); for (const m of mats) m.color.copy(tint); });
  return <primitive object={group} />;
}
