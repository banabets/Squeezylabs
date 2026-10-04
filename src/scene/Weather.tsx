import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Color, Group, IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { journey } from '../data/journey';
import { rng } from './Mango';
import { sky } from './daylight';

// Low-poly cumulus that drift over the archipelago and cast real shadows on the island.
// They are lit by the same sun as everything else, so they turn orange at sunset and blue at night.
const CENTER = { x: 6, z: 8 }, white = new Color('#ffffff'), moonlit = new Color('#55648c');
export function LowPolyClouds() {
  const { group, clouds, material } = useMemo(() => {
    const R = rng(17), group = new Group();
    // Realistic pass: the visible clouds live in the sky shader; these meshes only cast drifting shadows.
    const material = new MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: .12, colorWrite: false, depthWrite: false });
    const clouds = Array.from({ length: 9 }, (_, i) => {
      const puffs: BufferGeometry[] = [], count = 5 + Math.floor(R() * 3);
      for (let k = 0; k < count; k++) {
        const g = new IcosahedronGeometry(1.4 + R() * 1.2, 1);
        g.scale(1, .62, 1); g.translate((k - count / 2) * 1.6 + R() * .6, (k % 2) * .5 + R() * .4, (R() - .5) * 1.8);
        puffs.push(g);
      }
      const mesh = new Mesh(mergeGeometries(puffs)!, material);
      mesh.castShadow = true; mesh.raycast = () => {};
      // A ring around the archipelago: they cross the island now and then but never park over it.
      const angle = i / 9 * Math.PI * 2 + R() * .5, radius = 26 + R() * 40;
      mesh.scale.setScalar(1 + R() * .7);
      group.add(mesh);
      return { mesh, angle, radius, height: 24 + R() * 8, speed: .006 + R() * .006 };
    });
    return { group, clouds, material };
  }, []);
  const time = useRef(0);
  useFrame((_, dt) => {
    const n = sky.night.value;
    material.emissiveIntensity = .12 * (1 - n);
    material.color.copy(white).lerp(moonlit, n);
    if (!journey.paused && !journey.reduced) time.current += Math.min(dt, .05);
    for (const c of clouds) {
      const a = c.angle + time.current * c.speed;
      c.mesh.position.set(CENTER.x + Math.cos(a) * c.radius, c.height, CENTER.z + Math.sin(a) * c.radius * .8);
      c.mesh.rotation.y = -a;
    }
  });
  return <primitive object={group} />;
}
