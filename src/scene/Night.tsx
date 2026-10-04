import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Points, PointsMaterial } from 'three';
import { journey } from '../data/journey';
import { sky } from './daylight';
import { flat, lampGlass, nightGlass } from './flat';
import { CAYS, mainPoint } from '../data/world';
import { rng } from './Mango';

/** Windows and lamps glow as the horizon chapter turns to night. */
export function NightLights() {
  useFrame(() => {
    const n = sky.night.value;
    nightGlass.emissiveIntensity = n * 3;
    lampGlass.emissiveIntensity = .5 + n * 3;
  });
  return null;
}

/** Fireflies over the island's vegetation, visible only after dusk. */
export function Fireflies() {
  const { points, base, material } = useMemo(() => {
    const R = rng(23), pos: number[] = [];
    for (let i = 0; i < 140; i++) { const [x, z] = mainPoint(R() * Math.PI * 2, .25 + R() * .6); pos.push(x, .6 + R() * 2.2, z); }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    // A soft round glow per firefly; without a map, points render as hard squares.
    const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const k = c.getContext('2d')!, g = k.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); return new CanvasTexture(c); })();
    const material = new PointsMaterial({ color: '#e9ff8a', map: glow, size: .1, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
    const points = new Points(g, material); points.raycast = () => {};
    return { points, base: Float32Array.from(pos), material };
  }, []);
  const time = useRef(0);
  useFrame((_, dt) => {
    const n = sky.night.value;
    material.opacity = n * (.75 + Math.sin(time.current * 3) * .15);
    points.visible = n > .01;
    if (!points.visible || journey.paused || journey.reduced) return;
    time.current += Math.min(dt, .05);
    const p = points.geometry.attributes.position, t = time.current;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, base[i * 3] + Math.sin(t * .7 + i) * .3, base[i * 3 + 1] + Math.sin(t * 1.1 + i * 1.7) * .2, base[i * 3 + 2] + Math.cos(t * .6 + i * .9) * .3);
    p.needsUpdate = true;
  });
  return <primitive object={points} />;
}

/** A red-and-white lighthouse on the eastern cay; its beam sweeps the sea at night. */
export function Lighthouse() {
  const cay = CAYS[0];
  const { group, beam, beamMat } = useMemo(() => {
    const group = new Group();
    for (let i = 0; i < 6; i++) {
      const m = new Mesh(new CylinderGeometry(.62 - i * .06, .68 - i * .06, .9, 10), flat(i % 2 ? '#d24a3a' : '#fbf7ee'));
      m.position.y = .45 + i * .9; m.castShadow = m.receiveShadow = true; group.add(m);
    }
    const gallery = new Mesh(new CylinderGeometry(.6, .6, .12, 10), flat('#24413f')); gallery.position.y = 5.5; group.add(gallery);
    const lamp = new Mesh(new CylinderGeometry(.34, .34, .55, 10), lampGlass); lamp.position.y = 5.85; group.add(lamp);
    const cap = new Mesh(new ConeGeometry(.5, .5, 10), flat('#d24a3a')); cap.position.y = 6.35; cap.castShadow = true; group.add(cap);
    // The beam fades from the lamp to its far end instead of ending in a hard disc.
    const fade = document.createElement('canvas'); fade.width = 4; fade.height = 128; const fk = fade.getContext('2d')!, fg = fk.createLinearGradient(0, 0, 0, 128);
    fg.addColorStop(0, '#ffffff'); fg.addColorStop(.35, '#707070'); fg.addColorStop(1, '#000000'); fk.fillStyle = fg; fk.fillRect(0, 0, 4, 128);
    const beamMat = new MeshBasicMaterial({ color: '#fff2b0', alphaMap: new CanvasTexture(fade), transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, blending: AdditiveBlending, fog: false });
    const cone = new Mesh(new ConeGeometry(2.6, 26, 18, 1, true), beamMat);
    // Apex at the lamp, the beam widening outward.
    cone.rotation.z = -Math.PI / 2; cone.position.x = -13; cone.raycast = () => {};
    const beam = new Group(); beam.position.y = 5.85; beam.add(cone); group.add(beam);
    group.traverse(o => { if (o instanceof Mesh && !(o.material instanceof MeshBasicMaterial)) o.raycast = () => {}; });
    return { group, beam, beamMat };
  }, []);
  useFrame((_, dt) => {
    beamMat.opacity = sky.night.value * .22;
    if (!journey.paused && !journey.reduced) beam.rotation.y += Math.min(dt, .05) * .6;
  });
  return <primitive object={group} position={[cay.x + 1, .2, cay.z - .4]} />;
}
