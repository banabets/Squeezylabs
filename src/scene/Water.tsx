import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector2, Vector4 } from 'three';
import { journey } from '../data/journey';
import { BOATS, CAYS, MAIN, SANDBARS } from '../data/world';
import { sky } from './daylight';
import { waterFragment, waterVertex } from '../shaders/water';

export function ClearWater() {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSun: { value: sky.sunDir },
    uFog: { value: sky.horizon },
    uSkyRef: { value: sky.horizon },
    uFogRange: { value: new Vector2(80, 320) },
    uMain: { value: new Vector4(MAIN.rxW, MAIN.rxE, MAIN.rzN, MAIN.rzS) },
    uCays: { value: CAYS.map(c => new Vector4(c.x, c.z, c.rx, c.rz)) },
    uBars: { value: SANDBARS.map(b => new Vector4(...b)) },
    uBoats: { value: BOATS.map(b => new Vector4(b.x, b.z, b.ang, 0)) },
  }), []);
  useFrame((_, dt) => { if (!journey.paused && !journey.reduced) uniforms.uTime.value += dt; });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.31, 0]}>
    <planeGeometry args={[900, 900]} />
    <shaderMaterial vertexShader={waterVertex} fragmentShader={waterFragment} uniforms={uniforms} />
  </mesh>;
}
