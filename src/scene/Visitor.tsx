import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { journey } from '../data/journey';
import { PALETTE } from './flat';

const lime = PALETTE.lime, ink = PALETTE.ink;
/** Squeezy, the studio mascot: a small lime alien on a hover disc that floats in at arrival and waves. */
export function Visitor({ onSelect }: { onSelect: () => void }) {
  const root = useRef<Group>(null), head = useRef<Group>(null), arm = useRef<Group>(null), time = useRef(0);
  useFrame(({ size }, dt) => {
    if (!journey.paused && !journey.reduced) time.current += Math.min(dt, .05);
    const t = time.current, enter = journey.reduced ? 1 : MathUtils.smoothstep(t, 1, 4), narrow = size.width < 700;
    if (root.current) {
      root.current.position.set(narrow ? .2 : .85, 2.15 + (1 - enter) * 7 + Math.sin(t * 1.6) * .1, narrow ? 10.2 : 9.6);
      root.current.rotation.set(0, -.25 + Math.sin(t * .4) * .1, Math.sin(t * 1.1) * .04);
      root.current.scale.setScalar(narrow ? .55 : .62);
    }
    if (head.current) head.current.rotation.y = Math.sin(t * .5) * .25;
    // Waves for a moment every ten seconds, otherwise rests.
    if (arm.current) arm.current.rotation.z = Math.sin(t * .6) > .55 ? -2.3 + Math.sin(t * 9) * .35 : -.5;
  });
  const hover = (on: boolean) => () => { document.body.style.cursor = on ? 'pointer' : 'auto'; };
  return <group ref={root} onClick={e => { e.stopPropagation(); onSelect(); }} onPointerOver={hover(true)} onPointerOut={hover(false)}>
    <mesh position={[0, .62, 0]} scale={[1, 1.18, .95]} castShadow><sphereGeometry args={[.5, 24, 18]} /><meshStandardMaterial color={lime} roughness={.45} /></mesh>
    <group ref={head} position={[0, 1.28, 0]}>
      <mesh scale={[1.12, .95, 1]} castShadow><sphereGeometry args={[.46, 24, 18]} /><meshStandardMaterial color={lime} roughness={.45} /></mesh>
      {[-1, 1].map(s => <group key={s}>
        <mesh position={[s * .18, .04, .39]} scale={[.85, 1.25, .55]}><sphereGeometry args={[.13, 16, 12]} /><meshStandardMaterial color={ink} roughness={.15} /></mesh>
        <mesh position={[s * .18 - .03, .1, .46]}><sphereGeometry args={[.035, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <mesh position={[s * .3, -.12, .36]} scale={[1, .6, .4]}><sphereGeometry args={[.06, 10, 8]} /><meshStandardMaterial color="#ff8fa3" roughness={.6} /></mesh>
        <mesh position={[s * .16, .5, 0]} rotation={[0, 0, -s * .35]}><cylinderGeometry args={[.018, .018, .38, 6]} /><meshStandardMaterial color={lime} /></mesh>
        <mesh position={[s * .23, .68, 0]}><sphereGeometry args={[.065, 12, 8]} /><meshStandardMaterial color="#e9ffb0" emissive={lime} emissiveIntensity={.6} /></mesh>
      </group>)}
      <mesh position={[0, -.13, .43]} rotation={[0, 0, Math.PI]}><torusGeometry args={[.07, .018, 6, 16, Math.PI]} /><meshStandardMaterial color={ink} /></mesh>
    </group>
    <mesh position={[-.5, .75, 0]} rotation={[0, 0, .5]} castShadow><cylinderGeometry args={[.08, .08, .45, 8]} /><meshStandardMaterial color={lime} roughness={.45} /></mesh>
    <group ref={arm} position={[.42, .88, 0]}><mesh position={[.06, .22, 0]} castShadow><cylinderGeometry args={[.08, .08, .45, 8]} /><meshStandardMaterial color={lime} roughness={.45} /></mesh></group>
    <mesh castShadow><cylinderGeometry args={[.85, 1.05, .18, 28]} /><meshStandardMaterial color="#e6ece9" metalness={.35} roughness={.3} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.98, .04, 8, 40]} /><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={.5} /></mesh>
    <mesh position={[0, -.1, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[.9, 24]} /><meshBasicMaterial color="#d8ff7a" transparent opacity={.45} depthWrite={false} side={2} /></mesh>
  </group>;
}
