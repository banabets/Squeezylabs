import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CanvasTexture, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, LineBasicMaterial, LineSegments, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three';
import { RoundedBox } from '@react-three/drei';
import { Model } from './Props';
import { journey } from '../data/journey';
import { applyPbr } from './realism';

// Everyday things of a Venezuelan coastal town: a woven chinchorro slung under the pergola and a
// raspado cart parked in the plaza.

type V = [number, number, number];
const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; return t;
};

// ----- Chinchorro: a Wayuu-style striped hammock with fringes, hung between two pergola posts.
const HOOK_A = new Vector3(2.02, 2.05, 3.42), HOOK_B = new Vector3(2.02, 2.05, -.22);
const BED0 = .2, BED1 = .8, SAG = 1.25, HALF_W = .42;
function chinchorroParts() {
  // Woven stripes along the length, with a fine weave on top.
  const weave = canvasTex(256, 512, c => {
    const bands = ['#c4312b', '#f2a33a', '#f6d34a', '#2f8f87', '#1f4f8a', '#f6d34a', '#e0573c', '#7a2c5a'];
    let y = 0, i = 0; while (y < 512) { const h = 14 + ((i * 37) % 30); c.fillStyle = bands[i % bands.length]; c.fillRect(0, y, 256, h); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, y + h - 3, 256, 2); y += h; i++; }
    for (let x = 0; x < 256; x += 4) { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x, 0, 1, 512); }
    for (let yy = 0; yy < 512; yy += 3) { c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(0, yy, 256, 1); }
  });
  const fringeTex = canvasTex(256, 64, c => {
    for (let x = 0; x < 256; x += 3) { c.fillStyle = ['#c4312b', '#f2a33a', '#f6d34a', '#2f8f87'][Math.floor(x / 24) % 4]; c.fillRect(x, 0, 2, 52 + Math.sin(x) * 8); }
  });
  fringeTex.wrapS = RepeatWrapping; fringeTex.repeat.set(6, 1);
  const axis = HOOK_B.clone().sub(HOOK_A), len = axis.length();
  // Bed surface: catenary-like sag along the length, a cradle curve across, width narrowing to the ends.
  const NU = 40, NV = 12, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const point = (u: number, v: number) => {
    const t = BED0 + (BED1 - BED0) * u, w = HALF_W * Math.pow(Math.sin(Math.PI * u), .6) + .05;
    const s = v * 2 - 1;
    return [HOOK_A.x + s * w, HOOK_A.y - Math.sin(Math.PI * t) * SAG + .14 * s * s * Math.sin(Math.PI * u), HOOK_A.z + axis.z * t];
  };
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { pos.push(...point(i / NU, j / NV)); uv.push(j / NV, i / NU); }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const bed = new BufferGeometry(); bed.setAttribute('position', new Float32BufferAttribute(pos, 3)); bed.setAttribute('uv', new Float32BufferAttribute(uv, 2)); bed.setIndex(idx); bed.computeVertexNormals();
  // Fringes (flecos) hang from both long edges.
  const fpos: number[] = [], fuv: number[] = [], fidx: number[] = [];
  [0, 1].forEach((v, side) => {
    const base = fpos.length / 3;
    for (let i = 0; i <= NU; i++) { const p = point(i / NU, v), drop = .26 * Math.sin(Math.PI * i / NU) + .04; fpos.push(...p, p[0] + (side ? .03 : -.03), p[1] - drop, p[2]); fuv.push(i / NU, 1, i / NU, 0); }
    for (let i = 0; i < NU; i++) { const a = base + i * 2; fidx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const fringe = new BufferGeometry(); fringe.setAttribute('position', new Float32BufferAttribute(fpos, 3)); fringe.setAttribute('uv', new Float32BufferAttribute(fuv, 2)); fringe.setIndex(fidx); fringe.computeVertexNormals();
  // Cords (cabuyeras) fan from each hook to the bed ends.
  const cpos: number[] = [];
  for (let j = 0; j <= 14; j++) { const v = j / 14; [[HOOK_A, 0], [HOOK_B, 1]].forEach(([h, u]) => { const p = point(u as number, v); cpos.push((h as Vector3).x, (h as Vector3).y, (h as Vector3).z, ...p); }); }
  const cords = new BufferGeometry(); cords.setAttribute('position', new Float32BufferAttribute(cpos, 3));
  return {
    bed, fringe, len,
    bedMat: new MeshStandardMaterial({ map: weave, roughness: .95, side: DoubleSide }),
    fringeMat: new MeshStandardMaterial({ map: fringeTex, alphaTest: .5, roughness: 1, side: DoubleSide }),
    cords: new LineSegments(cords, new LineBasicMaterial({ color: '#d9c7a0' })),
  };
}
export function Chinchorro() {
  const ref = useRef<Group>(null), t = useRef(0);
  const p = useMemo(chinchorroParts, []);
  useFrame((_, dt) => {
    if (journey.paused || journey.reduced || !ref.current) return; t.current += Math.min(dt, .05);
    // A lazy swing about the line between the hooks.
    ref.current.rotation.z = Math.sin(t.current * .9) * .06;
  });
  return <group position={[HOOK_A.x, HOOK_A.y, 0]}><group ref={ref}><group position={[-HOOK_A.x, -HOOK_A.y, 0]}>
    <mesh geometry={p.bed} material={p.bedMat} castShadow receiveShadow />
    <mesh geometry={p.fringe} material={p.fringeMat} castShadow />
    <primitive object={p.cords} />
  </group></group></group>;
}

// ----- Carrito de raspados: shaved ice with bright syrups, sold from a hand-pushed cart.
const SYRUPS = ['#d81e3a', '#ff7a1a', '#f4d21c', '#5fcf2a', '#2a8fe0', '#e84fa8'];
export function RaspadoCart({ position = [15.5, .1, 11.3] as V, rotation = -2.35 }) {
  const parts = useMemo(() => {
    const sign = canvasTex(512, 160, c => {
      c.fillStyle = '#f6efe2'; c.fillRect(0, 0, 512, 160);
      c.fillStyle = '#c4312b'; c.fillRect(0, 0, 512, 14); c.fillRect(0, 146, 512, 14);
      c.font = '700 74px "Caveat Brush", "Segoe Script", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#1f4f8a'; c.fillText('Raspados', 256, 70);
      c.font = '600 24px Arial, sans-serif'; c.fillStyle = '#c4312b'; c.fillText('COLITA · TAMARINDO · PARCHITA', 256, 122);
    });
    document.fonts?.load('74px "Caveat Brush"').then(() => { const c = (sign.image as HTMLCanvasElement).getContext('2d')!; c.fillStyle = '#f6efe2'; c.fillRect(0, 30, 512, 80); c.font = '700 74px "Caveat Brush", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1f4f8a'; c.fillText('Raspados', 256, 70); sign.needsUpdate = true; }).catch(() => {});
    const stripes = canvasTex(512, 64, c => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#f6efe2' : '#c4312b'; c.fillRect(i * 32, 0, 32, 64); } });
    const wood = new MeshStandardMaterial({ color: '#d8c3a0' }); applyPbr(wood, 'brown_planks_05', { repeat: [1, 1], normalScale: .6 });
    const steel = new MeshStandardMaterial({ color: '#a9aeb2', metalness: .8, roughness: .38, envMapIntensity: .6 });
    const glass = new MeshPhysicalMaterial({ color: '#ffffff', roughness: .05, transmission: .9, thickness: .05, transparent: true, opacity: .45 });
    const ice = new MeshPhysicalMaterial({ color: '#e8f6ff', roughness: .15, transmission: .7, thickness: .3, transparent: true, opacity: .85 });
    return { sign, stripes, wood, steel, glass, ice, spoke: new CylinderGeometry(.006, .006, .5, 4) };
  }, []);
  return <group position={position} rotation={[0, rotation, 0]}>
    {/* Cart body: painted panel on a wooden box. */}
    <RoundedBox args={[1.3, .62, .66]} radius={.03} smoothness={2} position={[0, .72, 0]} material={parts.wood} castShadow receiveShadow />
    <mesh position={[0, .72, .335]}><planeGeometry args={[1.22, .38]} /><meshStandardMaterial map={parts.sign} roughness={.7} /></mesh>
    <mesh position={[0, 1.04, 0]} castShadow><boxGeometry args={[1.36, .03, .7]} /><primitive object={parts.steel} attach="material" /></mesh>
    {/* Two bicycle wheels on an axle, and a push handle. */}
    {[-1, 1].map(s => <group key={s} position={[.15, .3, s * .37]}>
      <mesh castShadow><torusGeometry args={[.28, .022, 8, 32]} /><meshStandardMaterial color="#1b1b1b" roughness={.8} /></mesh>
      {Array.from({ length: 8 }, (_, i) => <mesh key={i} geometry={parts.spoke} material={parts.steel} rotation={[0, 0, i * Math.PI / 8]} />)}
    </group>)}
    <mesh position={[.15, .3, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.015, .015, .76, 8]} /><primitive object={parts.steel} attach="material" /></mesh>
    {[-1, 1].map(s => <mesh key={s} position={[.78, .75, s * .26]} rotation={[0, 0, -1.1]}><cylinderGeometry args={[.016, .016, .5, 8]} /><primitive object={parts.steel} attach="material" /></mesh>)}
    {/* Front leg. */}
    <mesh position={[-.55, .2, .25]}><cylinderGeometry args={[.02, .02, .42, 8]} /><primitive object={parts.steel} attach="material" /></mesh>
    {/* The ice block under the hand shaver, and the row of syrup bottles. */}
    <mesh position={[-.32, 1.17, -.05]} castShadow><boxGeometry args={[.32, .22, .28]} /><primitive object={parts.ice} attach="material" /></mesh>
    <mesh position={[-.32, 1.31, -.05]}><boxGeometry args={[.2, .05, .14]} /><primitive object={parts.steel} attach="material" /></mesh>
    {SYRUPS.map((col, i) => <group key={col} position={[.0 + i * .1, 1.055, .16 - (i % 2) * .1]}>
      <mesh position={[0, .13, 0]}><cylinderGeometry args={[.035, .035, .26, 14]} /><primitive object={parts.glass} attach="material" /></mesh>
      <mesh position={[0, .1, 0]}><cylinderGeometry args={[.03, .03, .19, 14]} /><meshPhysicalMaterial color={col} roughness={.15} transmission={.4} thickness={.1} /></mesh>
      <mesh position={[0, .285, 0]}><cylinderGeometry args={[.012, .02, .05, 8]} /><meshStandardMaterial color="#f6efe2" /></mesh>
    </group>)}
    {/* A finished raspado in a paper cup. */}
    <group position={[.5, 1.06, -.18]}>
      <mesh position={[0, .05, 0]}><cylinderGeometry args={[.04, .03, .1, 14]} /><meshStandardMaterial color="#f6efe2" roughness={.8} /></mesh>
      <mesh position={[0, .11, 0]}><sphereGeometry args={[.045, 14, 10]} /><meshStandardMaterial color="#e8344a" roughness={.6} /></mesh>
    </group>
    {/* Striped parasol. */}
    <mesh position={[.1, 1.6, 0]}><cylinderGeometry args={[.015, .015, 1.1, 8]} /><primitive object={parts.steel} attach="material" /></mesh>
    <mesh position={[.1, 2.18, 0]} castShadow><coneGeometry args={[.95, .32, 16, 1, true]} /><meshStandardMaterial map={parts.stripes} side={DoubleSide} roughness={.9} /></mesh>
  </group>;
}

// ----- Papagayos: the hexagonal tissue-paper kites Venezuelan kids fly from the beach, with a long
// tail of knotted rags. Each one bobs on the breeze; the tail snakes behind it and the line runs
// down to the sand.
type Kite = { anchor: V; at: V; colors: string[]; phase: number; size: number };
const KITES: Kite[] = [
  { anchor: [-17, .1, 9.5], at: [-33, 8.8, 13], colors: ['#d8261f', '#f6d34a', '#1f5fb0'], phase: 0, size: 1.1 },
  { anchor: [2, .1, 12.5], at: [-1, 15.5, 23], colors: ['#f6d34a', '#2a9d4b', '#e84fa8'], phase: 2.1, size: 1 },
  { anchor: [15, .1, 16], at: [21, 12.5, 26], colors: ['#ff7a1a', '#ffffff', '#1f4f8a'], phase: 4.2, size: .9 },
];
const TAIL = 18;
function kiteParts(k: Kite) {
  // Hexagon, taller than wide, with panels in alternating tissue colors and a darker frame.
  const tex = canvasTex(256, 320, c => {
    const cx = 128, cy = 160, pts = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * 120, cy - Math.sin(a) * 155]; });
    pts.forEach((p, i) => { const q = pts[(i + 1) % 6]; c.fillStyle = k.colors[i % k.colors.length]; c.beginPath(); c.moveTo(cx, cy); c.lineTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.closePath(); c.fill(); });
    c.fillStyle = k.colors[1]; c.beginPath(); c.arc(cx, cy, 30, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(60,40,20,.9)'; c.lineWidth = 5; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[3][0], pts[3][1]); c.moveTo(pts[1][0], pts[1][1]); c.lineTo(pts[4][0], pts[4][1]); c.moveTo(pts[2][0], pts[2][1]); c.lineTo(pts[5][0], pts[5][1]); c.stroke();
  });
  const sail = new MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .4, side: DoubleSide, roughness: .8, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: .25 });
  // Hexagon shape matching the texture (uv from position).
  const verts: number[] = [0, 0, 0], uvs: number[] = [.5, .5], idx: number[] = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3, x = Math.cos(a) * .47, y = Math.sin(a) * .97 * .5 * 1.24; verts.push(x * k.size, y * k.size, 0); uvs.push(.5 + Math.cos(a) * 120 / 256, .5 + Math.sin(a) * 155 / 320); idx.push(0, i + 1, ((i + 1) % 6) + 1); }
  const geo = new BufferGeometry(); geo.setAttribute('position', new Float32BufferAttribute(verts, 3)); geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const line = new BufferGeometry(); line.setAttribute('position', new Float32BufferAttribute(new Float32Array(3 * 24), 3));
  const tail = new BufferGeometry(); tail.setAttribute('position', new Float32BufferAttribute(new Float32Array(3 * (TAIL + 1)), 3));
  return { geo, sail, line, tail };
}
function Papagayo({ k }: { k: Kite }) {
  const kite = useRef<Group>(null), bows = useRef<Group>(null), t = useRef(k.phase);
  const p = useMemo(() => kiteParts(k), [k]);
  const lineObj = useMemo(() => new LineSegments(p.line, new LineBasicMaterial({ color: '#efe9dc', transparent: true, opacity: .55 })), [p]);
  const tailObj = useMemo(() => new LineSegments(p.tail, new LineBasicMaterial({ color: '#f4efe2' })), [p]);
  const at = useMemo(() => new Vector3(...k.at), [k]), anchor = useMemo(() => new Vector3(...k.anchor), [k]);
  const pos = useMemo(() => new Vector3(), []), tmp = useMemo(() => new Vector3(), []);
  useFrame((_, dt) => {
    if (!journey.paused && !journey.reduced) t.current += Math.min(dt, .05);
    const s = t.current;
    pos.set(at.x + Math.sin(s * .5) * 1.2 + Math.sin(s * 1.3) * .3, at.y + Math.sin(s * .8) * .6, at.z + Math.cos(s * .4) * .6);
    if (kite.current) { kite.current.position.copy(pos); kite.current.lookAt(anchor); kite.current.rotateZ(Math.sin(s * 1.1) * .25); }
    // The line: a shallow catenary from the hand on the sand up to the kite's bridle.
    const la = p.line.attributes.position as Float32BufferAttribute;
    for (let i = 0; i < 12; i++) for (let e = 0; e < 2; e++) { const u = (i + e) / 12; tmp.copy(anchor).lerp(pos, u); tmp.y -= Math.sin(Math.PI * u) * 1.4; la.setXYZ(i * 2 + e, tmp.x, tmp.y, tmp.z); }
    la.needsUpdate = true;
    // The rag tail hangs down-wind and snakes; bows sit on every other segment.
    const ta = p.tail.attributes.position as Float32BufferAttribute;
    for (let i = 0; i <= TAIL; i++) { const u = i / TAIL; ta.setXYZ(i, pos.x + Math.sin(s * 3 - u * 7) * .5 * u, pos.y - .55 * k.size - u * 4.2, pos.z + u * 1.6 + Math.cos(s * 2.4 - u * 6) * .3 * u); }
    ta.needsUpdate = true;
    if (bows.current) bows.current.children.forEach((b, j) => { const i = (j + 1) * 2; b.position.set(ta.getX(i), ta.getY(i), ta.getZ(i)); b.rotation.z = Math.sin(s * 4 + j) * .6; });
  });
  // LineSegments need pairs; the tail is drawn as a strip by indexing consecutive points.
  useMemo(() => { const idx: number[] = []; for (let i = 0; i < TAIL; i++) idx.push(i, i + 1); p.tail.setIndex(idx); }, [p]);
  return <>
    <group ref={kite}><mesh geometry={p.geo} material={p.sail} /></group>
    <primitive object={lineObj} frustumCulled={false} />
    <primitive object={tailObj} frustumCulled={false} />
    <group ref={bows}>{Array.from({ length: TAIL / 2 }, (_, j) => <mesh key={j} frustumCulled={false}><planeGeometry args={[.32, .1]} /><meshStandardMaterial color={k.colors[j % k.colors.length]} side={DoubleSide} roughness={.9} /></mesh>)}</group>
  </>;
}
export function Papagayos() { return <>{KITES.map((k, i) => <Papagayo key={i} k={k} />)}</>; }

// ----- Beach toldo: a rented square canvas shade on four poles, with a cava (cooler), two plastic
// chairs and a towel, facing the sunset on the west beach.
export function BeachToldo({ position = [-14.2, .05, 17.5] as V, rotation = -1.35 }) {
  const parts = useMemo(() => {
    // Canvas with a scalloped valance in the toldo's color.
    const valance = canvasTex(512, 64, c => { c.fillStyle = '#1f6fb0'; c.fillRect(0, 0, 512, 34); for (let x = 0; x < 512; x += 32) { c.beginPath(); c.arc(x + 16, 34, 16, 0, Math.PI); c.fill(); } c.fillStyle = '#f6efe2'; c.fillRect(0, 6, 512, 4); });
    const top = new PlaneGeometry(2.6, 2.6, 12, 12); top.rotateX(-Math.PI / 2);
    const p = top.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 1.3, z = p.getZ(i) / 1.3; p.setY(i, -(1 - x * x) * (1 - z * z) * .14); } top.computeVertexNormals();
    const cava = canvasTex(256, 128, c => { c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#1f5fb0'; c.fillRect(0, 0, 256, 34); c.font = '700 30px Arial, sans-serif'; c.fillStyle = '#1f5fb0'; c.textAlign = 'center'; c.fillText('CAVA', 128, 90); });
    const towel = canvasTex(128, 256, c => { const cols = ['#f2c14e', '#e0573c', '#2f8f87', '#f6efe2']; for (let y = 0; y < 256; y += 32) { c.fillStyle = cols[(y / 32) % 4]; c.fillRect(0, y, 128, 32); } });
    return { valance, top, cava, towel, canvas: new MeshStandardMaterial({ color: '#f4efe2', roughness: .95, side: DoubleSide }), pole: new MeshStandardMaterial({ color: '#9c7449', roughness: .8 }) };
  }, []);
  const H = 2.25;
  return <group position={position} rotation={[0, rotation, 0]}>
    {[-1, 1].map(sx => [-1, 1].map(sz => <mesh key={`${sx}${sz}`} position={[sx * 1.22, H / 2, sz * 1.22]} material={parts.pole} castShadow><cylinderGeometry args={[.035, .04, H, 8]} /></mesh>))}
    <mesh geometry={parts.top} material={parts.canvas} position={[0, H + .02, 0]} castShadow receiveShadow />
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[Math.sin(i * Math.PI / 2) * 1.3, H - .12, Math.cos(i * Math.PI / 2) * 1.3]} rotation={[0, i * Math.PI / 2, 0]}><planeGeometry args={[2.6, .3]} /><meshStandardMaterial map={parts.valance} transparent alphaTest={.4} side={DoubleSide} roughness={.9} /></mesh>)}
    <Model id="plastic_monobloc_chair_01" position={[-.45, 0, .2]} rotation={-.25} />
    <Model id="plastic_monobloc_chair_01" position={[.55, 0, .35]} rotation={.3} />
    {/* Cava with a blue lid. */}
    <group position={[.05, 0, -.75]} rotation={[0, .4, 0]}>
      <RoundedBox args={[.62, .38, .38]} radius={.04} smoothness={3} position={[0, .19, 0]} castShadow><meshStandardMaterial map={parts.cava} roughness={.5} /></RoundedBox>
      <RoundedBox args={[.64, .07, .4]} radius={.03} smoothness={3} position={[0, .4, 0]} castShadow><meshStandardMaterial color="#1f5fb0" roughness={.45} /></RoundedBox>
    </group>
    <mesh position={[1.4, .012, 1.1]} rotation={[-Math.PI / 2, 0, .3]} receiveShadow><planeGeometry args={[.8, 1.6]} /><meshStandardMaterial map={parts.towel} roughness={1} /></mesh>
  </group>;
}

// ----- Atarraya: a hand-thrown cast net hung to dry from a pole on the north beach.
export function Atarraya({ position = [2.2, .05, -6.7] as V }) {
  const { mat, net, hem } = useMemo(() => {
    const t = canvasTex(128, 128, c => { c.strokeStyle = 'rgba(232,226,208,.95)'; c.lineWidth = 2.2; for (let i = -128; i < 256; i += 12) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.stroke(); c.beginPath(); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); } });
    t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(9, 5);
    // A wet net hangs gathered from its horn: narrow at the top, heavy vertical folds where the lead
    // line pulls it down, and an uneven hem that drags on one side.
    const H = 1.75, net = new CylinderGeometry(.03, .34, H, 56, 14, true), p = net.attributes.position, hem: V[] = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x), v = (y + H / 2) / H, r = Math.hypot(x, z);
      const fold = 1 + (.22 * Math.sin(a * 7 + v * 1.5) + .1 * Math.sin(a * 13 + 1)) * Math.pow(1 - v, 1.3);
      const rr = r * fold * (1 + .25 * Math.sin(a + .6) * (1 - v)), drop = (1 - v) * (.07 * Math.sin(a * 3 + .4) + .05 * Math.cos(a * 5));
      p.setXYZ(i, Math.cos(a) * rr + (1 - v) * .06, y + drop, Math.sin(a) * rr);
    }
    net.computeVertexNormals();
    for (let k = 0; k < 28; k++) { const i = k * 2; hem.push([p.getX(i), p.getY(i) - .01, p.getZ(i)]); }
    return { mat: new MeshStandardMaterial({ map: t, transparent: true, alphaTest: .3, side: DoubleSide, roughness: 1 }), net, hem };
  }, []);
  return <group position={position}>
    <mesh position={[0, 1.3, 0]} castShadow><cylinderGeometry args={[.05, .06, 2.6, 8]} /><meshStandardMaterial color="#8a6a48" roughness={.9} /></mesh>
    <mesh position={[.25, 2.58, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.035, .035, .7, 8]} /><meshStandardMaterial color="#8a6a48" roughness={.9} /></mesh>
    {/* Hand line from the arm to the net's horn. */}
    <mesh position={[.52, 2.48, 0]}><cylinderGeometry args={[.008, .008, .2, 5]} /><meshStandardMaterial color="#d8cdb2" roughness={.9} /></mesh>
    <group position={[.52, 1.5, 0]}>
      <mesh geometry={net} castShadow><primitive object={mat} attach="material" /></mesh>
      {hem.map((h, i) => <mesh key={i} position={h}><sphereGeometry args={[.022, 6, 4]} /><meshStandardMaterial color="#6d7275" metalness={.6} roughness={.4} /></mesh>)}
    </group>
  </group>;
}

// ----- Hand-painted signs over the village doors.
function SignBoard({ position, rotation = 0, lines, bg, ink, w = 1.3, h = .42 }: { position: V; rotation?: number; lines: string[]; bg: string; ink: string; w?: number; h?: number }) {
  const tex = useMemo(() => {
    const draw = (c: CanvasRenderingContext2D) => {
      c.fillStyle = bg; c.fillRect(0, 0, 512, 168); c.strokeStyle = ink; c.lineWidth = 6; c.strokeRect(10, 10, 492, 148);
      c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
      lines.forEach((l, i) => { c.font = `${i ? 40 : 66}px "Caveat Brush", "Segoe Script", cursive`; c.fillText(l, 256, lines.length === 1 ? 88 : 64 + i * 58); });
      // Sun-faded paint.
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${(i * 37 % 100) / 830})`; c.fillRect((i * 151) % 512, (i * 89) % 168, 4 + (i * 13) % 20, 2); }
    };
    const t = canvasTex(512, 168, draw);
    document.fonts?.load('66px "Caveat Brush"').then(() => { draw((t.image as HTMLCanvasElement).getContext('2d')!); t.needsUpdate = true; }).catch(() => {});
    return t;
  }, [lines, bg, ink]);
  return <mesh position={position} rotation={[0, rotation, .025]} castShadow>
    <boxGeometry args={[w, h, .03]} />
    {[0, 1, 2, 3].map(i => <meshStandardMaterial key={i} attach={`material-${i}`} color={bg} roughness={.9} />)}
    <meshStandardMaterial attach="material-4" map={tex} roughness={.9} />
    <meshStandardMaterial attach="material-5" color={bg} roughness={.9} />
  </mesh>;
}
const SIGN_A = ['Se vende hielo', 'y frías · pregunte'], SIGN_B = ['Hay pan', 'canilla · dulce · de jamón'];
export function VillageSigns() {
  return <>
    <SignBoard position={[16.5, 3.42, 2.56]} lines={SIGN_A} bg="#f4efe2" ink="#1f4f8a" />
    <SignBoard position={[13, 3.42, 15.54]} rotation={Math.PI} lines={SIGN_B} bg="#f2c14e" ink="#7a2c1a" />
  </>;
}
