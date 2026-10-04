import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, ShaderMaterial, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { journey } from '../data/journey';
import { sky } from './daylight';
import { flat, PALETTE } from './flat';

type V = [number, number, number];
// Strings of bulbs over the arrival: one across the pergola front and one to each cottage eave.
const STRINGS: [V, V, number][] = [
  [[-2.1, 3.62, 3.62], [2.1, 3.62, 3.62], .5],
  [[-4.62, 3.72, 1.05], [-2.1, 3.62, 3.4], .38],
  [[2.1, 3.62, 3.4], [3.2, 3.72, -.85], .32],
];
const BULB_TINTS = ['#ffd27a', '#ffe7b0', '#ffb36b', '#fff1c9'];
const sag = ([a, b, s]: [V, V, number], t: number) => new Vector3(...a).lerp(new Vector3(...b), t).setY(a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * s);

export function Festoons() {
  const bulbs = useRef<InstancedMesh>(null);
  const { wire, bulbGeo, bulbMat, count, matrices } = useMemo(() => {
    const curves = STRINGS.map(st => new CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => sag(st, i / 12))));
    const tube = curves.map(c => new TubeGeometry(c, 40, .012, 4));
    const o = new Object3D(), m: { matrix: number[]; tint: Color }[] = [];
    STRINGS.forEach((st, si) => { const n = Math.round(new Vector3(...st[0]).distanceTo(new Vector3(...st[1])) / .42); for (let i = 1; i < n; i++) { o.position.copy(sag(st, i / n)).y -= .07; o.updateMatrix(); m.push({ matrix: o.matrix.toArray(), tint: new Color(BULB_TINTS[(i + si) % 4]) }); } });
    const mat = new MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffcf7a', emissiveIntensity: 1.4, roughness: .3, toneMapped: false });
    return { wire: tube, bulbGeo: new SphereGeometry(.055, 10, 8), bulbMat: mat, count: m.length, matrices: m };
  }, []);
  useFrame(({ clock }) => {
    const im = bulbs.current;
    if (!im) return;
    if (!im.userData.ready) { matrices.forEach((b, i) => { im.setMatrixAt(i, m4.fromArray(b.matrix)); im.setColorAt(i, b.tint); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.userData.ready = true; }
    // Soft glow by day, properly lit at dusk and night, with a slow incandescent shimmer.
    bulbMat.emissiveIntensity = 1.3 + sky.warmth.value * 2.2 + sky.night.value * 3.5 + (journey.paused ? 0 : Math.sin(clock.elapsedTime * 3.1) * .08);
  });
  return <group>
    {wire.map((g, i) => <mesh key={i} geometry={g} material={flat(PALETTE.ink)} />)}
    {/* Instances are placed on the first frame, so the default bounds (one bulb at the origin) would cull them. */}
    <instancedMesh ref={bulbs} args={[bulbGeo, bulbMat, count]} frustumCulled={false} />
  </group>;
}
const m4 = new Matrix4();

// Sunlit dust and pollen drifting over the arrival path; additive, so it only reads against shade.
export function Motes({ count = 160 }) {
  const mat = useRef<ShaderMaterial>(null);
  const geo = useMemo(() => {
    const g = new BufferGeometry(), p: number[] = [], seed: number[] = [];
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) { p.push(-6 + r() * 12, .5 + r() * 4.2, -1 + r() * 14); seed.push(r()); }
    g.setAttribute('position', new Float32BufferAttribute(p, 3)); g.setAttribute('seed', new Float32BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uFade: { value: 1 } }), []);
  useFrame((_, dt) => {
    if (!journey.paused && !journey.reduced) uniforms.uTime.value += Math.min(dt, .05);
    // Only while walking through the studio, between the bodega and the climb to the horizon.
    const r = journey.rendered; uniforms.uFade.value = Math.min(1, Math.max(0, (r - .2) / .15)) * (1 - Math.min(1, Math.max(0, (r - .72) / .12)));
  });
  return <points geometry={geo} frustumCulled={false}>
    <shaderMaterial ref={mat} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} uniforms={uniforms}
      vertexShader={`attribute float seed;uniform float uTime;varying float vA;
      void main(){vec3 p=position;float t=uTime*(.25+seed*.25)+seed*40.;
      p.y=.5+mod(p.y-.5+uTime*.08*(.5+seed),4.2);p.x+=sin(t)*.35;p.z+=cos(t*.7)*.3;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=min(3.5,(2.+seed*3.)*(14./-mv.z));vA=(.45+.55*sin(uTime*1.7+seed*30.))*smoothstep(.5,1.,p.y)*smoothstep(4.7,3.8,p.y);}`}
      fragmentShader={`uniform float uFade;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vec3(1.,.93,.7)*a*vA*uFade*.55,1.);}`} />
  </points>;
}
