import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { type MeshStandardMaterial, type Object3D } from 'three';

// Scanned CC0 props from Poly Haven (public/models, compressed to GLB with meshopt + WebP by
// gltf-transform). They replace the box-built furniture that made the world read as a mockup.
type V = [number, number, number];
const url = (id: string) => `/models/${id}.glb`;
export function Model({ id, position, rotation = 0, scale = 1, tint }: { id: string; position: V; rotation?: number; scale?: number | V; tint?: string }) {
  const { scene } = useGLTF(url(id));
  const object = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o: Object3D & { isMesh?: boolean; castShadow?: boolean; receiveShadow?: boolean; material?: MeshStandardMaterial }) => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true; o.raycast = () => {};
      // Optional tint multiplies the scanned albedo (e.g. red soda crates from an amber scan).
      if (tint && o.material) { o.material = o.material.clone(); o.material.color.set(tint); }
    });
    return c;
  }, [scene, tint]);
  return <primitive object={object} position={position} rotation={[0, rotation, 0]} scale={scale} />;
}

// Bodega sidewalk and counter, in the bodega's local frame (front toward +z).
function BodegaProps() {
  return <group position={[19, .06, 7]} rotation={[0, -Math.PI / 2, 0]}>
    <Model id="CashRegister_01" position={[-1.05, 1.05, -1.02]} rotation={Math.PI} scale={.5} />
    {/* Stacked soda crates by the door, the way every bodega keeps its empties. */}
    <Model id="plastic_crate_02" tint="#ff6a5c" position={[3.15, 0, 1.05]} rotation={.1} />
    <Model id="plastic_crate_02" tint="#ff6a5c" position={[3.15, .255, 1.05]} rotation={-.06} />
    <Model id="plastic_crate_02" tint="#ff6a5c" position={[3.62, 0, 1.5]} rotation={.42} />
    <Model id="plastic_crate_02" tint="#ff6a5c" position={[3.6, .255, 1.48]} rotation={.3} />
    <Model id="plastic_crate_02" tint="#ff6a5c" position={[3.15, .51, 1.06]} rotation={.2} />
    {/* Domino table with two monobloc chairs. */}
    <Model id="round_wooden_table_01" position={[-3, 0, 1.45]} scale={.65} />
    <Model id="plastic_monobloc_chair_01" position={[-3.75, 0, 1.78]} rotation={1.98} />
    <Model id="plastic_monobloc_chair_01" position={[-2.3, 0, 1.95]} rotation={-2.18} />
    <Model id="plastic_monobloc_chair_01" position={[-3.1, 0, .55]} rotation={.15} />
    <Model id="potted_plant_04" position={[-1.95, 1.08, -.62]} rotation={.4} scale={1.1} />
    {/* Wall lantern beside the door. */}
    <Model id="street_lamp_02" position={[-2.45, 2.05, .06]} scale={.8} />
  </group>;
}

// Plaza, studio and beach details in world coordinates.
function WorldProps() {
  return <>
    <Model id="painted_wooden_bench" position={[10.6, .1, 6.2]} rotation={Math.PI / 2} scale={1.25} />
    <Model id="painted_wooden_bench" position={[10.6, .1, 11.4]} rotation={Math.PI / 2} scale={1.25} />
    <Model id="painted_wooden_bench" position={[15.2, .1, 13.6]} rotation={Math.PI} scale={1.25} />
    {/* A window unit on the neighbor's facade: every coastal house has one. */}
    <Model id="exterior_aircon_unit" position={[13.36, 2.6, .9]} rotation={-Math.PI / 2} scale={.62} />
    <Model id="lifebuoy" position={[2.2, 1.75, 3.72]} />
    <Model id="lambis_shell" position={[1.4, .07, 9.4]} rotation={.8} scale={1.4} />
    <Model id="lambis_shell" position={[-2.2, .07, 12.1]} rotation={2.4} scale={1.2} />
    {/* Studio: the web desk and the games cottage. */}
    <Model id="classic_laptop" position={[5.3, 1.186, -2.02]} rotation={.25} />
    <Model id="desk_lamp_arm_01" position={[7.0, 1.186, -2.45]} rotation={-2.4} />
    <Model id="GreenChair_01" position={[6.1, .4, -1.4]} rotation={Math.PI + .15} />
    <Model id="WoodenTable_02" position={[-8.75, .32, -1.7]} scale={1.6} />
    <Model id="Television_01" position={[-8.75, .99, -1.7]} rotation={.5} />
    <Model id="boombox" position={[-5.4, .32, -2.1]} rotation={-.4} />
    {/* The fishing pier on the north beach is built in Pier.tsx. */}
    <Model id="potted_plant_04" position={[9.9, .1, 4.9]} scale={2.6} />
    <Model id="potted_plant_04" position={[15.8, .1, 4.4]} rotation={1} scale={2.3} />
  </>;
}

export function Props() { return <><BodegaProps /><WorldProps /></>; }
['CashRegister_01', 'plastic_crate_02', 'round_wooden_table_01', 'plastic_monobloc_chair_01', 'potted_plant_04', 'painted_wooden_bench', 'exterior_aircon_unit', 'lifebuoy', 'lambis_shell', 'street_lamp_02', 'classic_laptop', 'desk_lamp_arm_01', 'GreenChair_01', 'WoodenTable_02', 'Television_01', 'boombox'].forEach(id => useGLTF.preload(url(id)));
