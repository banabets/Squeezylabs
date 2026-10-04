import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Group, MathUtils, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { journey } from '../data/journey';

// Squeezy, the studio mascot, is the logo itself: the inflated lime "S" and its dot. The S is built
// from metaballs along the logo's traced centerline, so it fuses into one soft, rounded volume like the
// logo render. Its personality is in the motion: hops, a jelly squash on landing, and a squeeze plus a
// droplet when touched.

// Centerline traced from public/brand/squeezy.png (1254 px square): [x, y, radius] in pixels.
const TRACE = [[858, 338, 78], [770, 382, 98], [640, 452, 108], [505, 532, 106], [440, 610, 100], [520, 668, 98], [690, 700, 106], [800, 760, 104], [800, 860, 90], [700, 925, 74], [592, 940, 58]];
const PX = 1 / 420, C = 627, SPAN = 3.2;
const curve = new CatmullRomCurve3(TRACE.map(([x, y]) => new Vector3((x - C) * PX, -(y - C) * PX, 0)), false, 'centripetal');
const radAt = (u: number) => { const f = u * (TRACE.length - 1), i = Math.min(TRACE.length - 2, Math.floor(f)), k = f - i, s = k * k * (3 - 2 * k); return (TRACE[i][2] * (1 - s) + TRACE[i + 1][2] * s) * PX; };

function logoGeometry() {
  const mc = new MarchingCubes(96, new MeshStandardMaterial(), false, false, 120000), p = new Vector3(), SUB = 12, N = 70;
  mc.isolation = 80; mc.reset();
  for (let i = 0; i <= N; i++) { const u = i / N; curve.getPointAt(u, p); const r = radAt(u) / SPAN * .62; mc.addBall(.5 + p.x / SPAN, .5 + p.y / SPAN, .5, r * r * (80 + SUB), SUB); }
  mc.update();
  const n = mc.count * 3, g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(mc.positionArray.slice(0, n), 3));
  g.setAttribute('normal', new BufferAttribute(mc.normalArray.slice(0, n), 3));
  g.scale(SPAN / 2, SPAN / 2, SPAN / 2 * .8);
  mc.geometry.dispose(); (mc.material as MeshStandardMaterial).dispose();
  return g;
}

// The logo's candy: deep green where the surface faces you, bright yellow-lime toward the silhouette,
// clearcoat on top and a glowing rim that bloom picks up.
function candy() {
  const m = new MeshPhysicalMaterial({ color: '#6fd000', roughness: .3, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: .8 });
  m.onBeforeCompile = s => {
    s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float facing=clamp(dot(normal,normalize(vViewPosition)),0.,1.);
      diffuseColor.rgb=mix(vec3(.13,.44,.0),vec3(.66,.97,.04),smoothstep(.05,.95,1.-facing*.85));
      totalEmissiveRadiance+=vec3(.75,1.,.05)*pow(1.-facing,2.2)*.9;`);
  };
  m.customProgramCacheKey = () => 'squeezy-candy-v2';
  return m;
}

const DOT_X = (425 - C) * PX - .15;

export function Visitor({ onSelect }: { onSelect: () => void }) {
  const root = useRef<Group>(null), pivot = useRef<Group>(null), dot = useRef<Mesh>(null), drop = useRef<Mesh>(null);
  const st = useRef({ t: 0, sq: 0, vel: 0, hop: 0, hopV: 0, drop: -1, nextHop: 2.5, hover: 0, hovered: false });
  const parts = useMemo(() => ({ s: logoGeometry(), ball: new SphereGeometry(100 * PX, 48, 32), drip: new SphereGeometry(.05, 24, 16), mat: candy() }), []);

  useFrame((_, dt) => {
    const s = st.current, still = journey.paused || journey.reduced, d = Math.min(dt, .05);
    if (!still) s.t += d;
    const t = s.t;
    // Hops on its own every few seconds: gravity, then a landing squash on a damped spring.
    if (!still && t > s.nextHop) { if (s.hop <= .001) s.hopV = 3.4; s.nextHop = t + 3 + Math.random() * 2.5; }
    s.hopV -= 14 * d; s.hop += s.hopV * d;
    if (s.hop < 0) { if (s.hopV < -1) s.vel -= Math.min(7, -s.hopV * 1.4); s.hop = 0; s.hopV = 0; }
    if (s.hopV > 0) s.sq = Math.min(s.sq, -s.hopV * .03);
    s.vel += (-110 * s.sq - 9 * s.vel) * d; s.sq += s.vel * d;
    s.hover = MathUtils.damp(s.hover, s.hovered ? 1 : 0, 8, d);
    const q = s.sq, breathe = still ? 0 : Math.sin(t * 2.1) * .012;
    if (root.current) {
      // Squeezy keeps the bodega: standing on the counter between the candy jar and the notebook, facing the plaza.
      root.current.position.set(19.95, 1.1, 7.2);
      root.current.rotation.y = -Math.PI / 2;
      root.current.scale.setScalar(.4 * (1 + s.hover * .05));
    }
    // Dev-only placement hook for screenshot tooling: window.__squeezy = { pos, rotY, scale }.
    if (import.meta.env.DEV) { const o = (window as any).__squeezy; if (o && root.current) { root.current.position.set(...(o.pos as [number, number, number])); root.current.rotation.y = o.rotY; root.current.scale.setScalar(o.scale); } }
    if (pivot.current) {
      // Pivot at the base so the squash compresses toward the counter.
      pivot.current.position.y = .05 + s.hop;
      pivot.current.scale.set(1 + q * .5 - breathe, 1 - q + breathe, 1 + q * .5 - breathe);
      pivot.current.rotation.z = Math.sin(t * .9) * .05 - (s.hopV > 0 ? .05 : 0);
      pivot.current.rotation.y = Math.sin(t * .45) * .25;
    }
    // The dot bounces beside it on its own rhythm.
    if (dot.current) { const b = Math.abs(Math.sin(t * 2.6 + 1)) * .35, land = b < .04; dot.current.position.set(DOT_X, .26 + b, .1); dot.current.scale.set(land ? 1.18 : 1, land ? .84 : 1, .8); }
    // Squeeze droplet: arcs up and falls.
    if (drop.current) {
      if (s.drop >= 0) { s.drop += d; const k = s.drop; drop.current.position.set(.45 + k * .3, 1.9 + k * 1.2 - k * k * 4.5, .2); drop.current.scale.setScalar(.6 + (1 - k) * .6); if (k > .9) s.drop = -1; }
      drop.current.visible = s.drop >= 0;
    }
  });

  const hover = (on: boolean) => () => { st.current.hovered = on; document.body.style.cursor = on ? 'pointer' : 'auto'; };
  return <group ref={root} onClick={e => { e.stopPropagation(); st.current.vel -= 9; st.current.drop = 0; onSelect(); }} onPointerOver={hover(true)} onPointerOut={hover(false)}>
    <group ref={pivot}>
      <mesh geometry={parts.s} material={parts.mat} position={[0, .95, 0]} castShadow receiveShadow />
    </group>
    <mesh ref={dot} geometry={parts.ball} material={parts.mat} castShadow />
    <mesh ref={drop} geometry={parts.drip} material={parts.mat} visible={false} />
  </group>;
}
