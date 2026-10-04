import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial, Vector2, Vector4 } from 'three';
import { journey } from '../data/journey';
import { BOATS, CAYS, MAIN, SANDBARS } from '../data/world';
import { sky } from './daylight';
import { waterFragment, waterVertex } from '../shaders/water';
import { LOW } from '../quality';

export function ClearWater() {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uNight: sky.night,
    uSun: { value: sky.sunDir },
    uFog: { value: sky.horizon },
    uSkyRef: { value: sky.horizon },
    uSkyTop: { value: sky.top },
    uSunCol: { value: sky.sunColor },
    uFogRange: { value: new Vector2(80, 320) },
    uMain: { value: new Vector4(MAIN.rxW, MAIN.rxE, MAIN.rzN, MAIN.rzS) },
    uCays: { value: CAYS.map(c => new Vector4(c.x, c.z, c.rx, c.rz)) },
    uBars: { value: SANDBARS.map(b => new Vector4(...b)) },
    uBoats: { value: BOATS.map(b => new Vector4(b.x, b.z, b.ang, 0)) },
  }), []);
  useFrame((_, dt) => { if (!journey.paused && !journey.reduced) uniforms.uTime.value += dt; });
  const material = useMemo(() => new ShaderMaterial({ vertexShader: waterVertex, fragmentShader: waterFragment, uniforms, defines: LOW ? { LOW_WATER: '' } : {} }), [uniforms]);
  // A finely tessellated sheet around the archipelago carries the swell; a flat sheet beneath it reaches the horizon.
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, -.31, 10]} material={material}><planeGeometry args={[150, 130, 96, 84]} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.42, 0]} material={material}><planeGeometry args={[900, 900]} /></mesh>
  </>;
}
