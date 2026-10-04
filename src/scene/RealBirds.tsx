import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Box3, Group, LoopRepeat, Vector3, type AnimationClip, type Object3D } from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { journey } from '../data/journey';

// Animated birds from Sketchfab (CC BY): "Seagull" by Dayvable and "Scarlet Macaw" by Mateus Schwaab.
// Each model is normalized to a real wingspan and turned so it flies along its local +z.
type Spec = { url: string; span: number; yaw: number; pitch: number; clip: string };
export const SEAGULL: Spec = { url: '/models/seagull.glb', span: 1.25, yaw: Math.PI / 2, pitch: 0, clip: 'ArmatureAction.006' };
export const MACAW: Spec = { url: '/models/macaw.glb', span: 1.05, yaw: 0, pitch: .52, clip: 'Armature|Fly01' };

function useBird(spec: Spec, count: number) {
  const { scene, animations } = useGLTF(spec.url);
  return useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3()), scale = spec.span / Math.max(size.x, size.z);
    return Array.from({ length: count }, () => {
      const model = cloneSkinned(scene) as Object3D, holder = new Group(), root = new Group();
      // The clips animate the model's own root, so scale and orientation go on the holder around it.
      holder.scale.setScalar(scale); holder.rotation.set(spec.pitch, spec.yaw, 0, 'YXZ');
      model.traverse(o => { o.castShadow = true; o.raycast = () => {}; o.frustumCulled = false; });
      holder.add(model); root.add(holder); root.rotation.order = 'YXZ';
      const mixer = new AnimationMixer(model), clip = animations.find(a => a.name === spec.clip) ?? animations[0];
      return { root, mixer, clip: clip as AnimationClip };
    });
  }, [scene, animations, spec, count]);
}

function Flock({ spec, count, center, radius, height, speed, seed, pair = false }: { spec: Spec; count: number; center: [number, number]; radius: [number, number]; height: [number, number]; speed: number; seed: number; pair?: boolean }) {
  const birds = useBird(spec, count), group = useRef<Group>(null), time = useRef(0);
  const paths = useMemo(() => birds.map((_, i) => { const r = (n: number) => { const x = Math.sin((i + seed) * 91.3 + n * 17.7) * 43758.5; return x - Math.floor(x); };
    // A pair keeps together: same heading and speed, the second a wingspan or two behind and outside.
    if (pair) return { phase: 1.3 - i * .14, rad: radius[0] + i * .9, h: height[0] + i * .35, sp: speed, dir: 1 };
    return { phase: r(1) * 6.28, rad: radius[0] + r(2) * (radius[1] - radius[0]), h: height[0] + r(3) * (height[1] - height[0]), sp: speed * (.8 + r(4) * .4), dir: r(5) < .5 ? 1 : -1 }; }), [birds, radius, height, speed, seed, pair]);
  useEffect(() => {
    birds.forEach((b, i) => { const a = b.mixer.clipAction(b.clip); a.setLoop(LoopRepeat, Infinity); a.time = i * .37; a.timeScale = .85 + (i % 3) * .1; a.play(); group.current?.add(b.root); });
    return () => birds.forEach(b => { b.mixer.stopAllAction(); b.root.removeFromParent(); });
  }, [birds]);
  useFrame((_, dt) => {
    const step = journey.paused || journey.reduced ? 0 : Math.min(dt, .05); time.current += step;
    birds.forEach((b, i) => {
      const p = paths[i], a = p.phase + time.current * p.sp * p.dir;
      const x = center[0] + Math.cos(a) * p.rad, z = center[1] + Math.sin(a) * p.rad * .8;
      // Tangent of the loop gives the heading; bank into the turn.
      const tx = -Math.sin(a) * p.dir, tz = Math.cos(a) * .8 * p.dir;
      b.root.position.set(x, p.h + Math.sin(time.current * .5 + p.phase) * .6, z);
      b.root.rotation.set(0, Math.atan2(tx, tz), .28 * p.dir);
      b.mixer.update(step);
      // Dev-only: window.__track = 'gull' | 'macaw' frames the first bird of that flock for screenshots.
      if (import.meta.env.DEV && i === 0 && (window as any).__track === (spec === SEAGULL ? 'gull' : 'macaw')) { const P = b.root.position, d = spec === MACAW ? 1.5 : 2.6; const W = window as any; if (W.__view === 'top') { if (!W.__frozen) W.__frozen = { pos: [P.x, P.y + (spec === MACAW ? 3.5 : 7), P.z + .01], target: [P.x, P.y, P.z], light: .4 }; W.__cam = W.__frozen; } else { const v = W.__view === 'back' ? [-tx, -tz] : [tz, -tx]; W.__cam = { pos: [P.x + v[0] * d, P.y + .5, P.z + v[1] * d], target: [P.x, P.y, P.z], light: .4 }; } }
    });
  });
  return <group ref={group} />;
}

export function RealBirds() {
  return <>
    <Flock spec={SEAGULL} count={6} center={[6, 8]} radius={[14, 28]} height={[6, 10.5]} speed={.11} seed={3} />
    <Flock spec={MACAW} count={2} center={[8, 6]} radius={[9, 10]} height={[6.5, 7.2]} speed={.16} seed={11} pair />
  </>;
}
useGLTF.preload(SEAGULL.url); useGLTF.preload(MACAW.url);
