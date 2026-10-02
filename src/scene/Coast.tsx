import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, Shape, ShaderMaterial, Vector2 } from 'three';
import { Box, Beam } from './Primitives';
import { journey } from '../data/journey';
import { waterFragment, waterVertex } from '../shaders/water';
import { sandTexture } from './textures';
import { NaturalTerrain, BeachStones } from './Terrain';
export function CaribbeanWater(){
 const ref=useRef<ShaderMaterial>(null);
 const uniforms=useMemo(()=>({uTime:{value:0}}),[]);
 useFrame((_,dt)=>{if(ref.current&&!journey.paused&&!journey.reduced)ref.current.uniforms.uTime.value+=dt;});
 return <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.3,0]}><planeGeometry args={[700,700,180,180]}/><shaderMaterial ref={ref} vertexShader={waterVertex} fragmentShader={waterFragment} uniforms={uniforms}/></mesh>;
}
export function Island(){
 const shape=useMemo(()=>{const s=new Shape();s.moveTo(-20,13);s.bezierCurveTo(-24,1,-15,-8,-8,-8);s.bezierCurveTo(-2,-7,1,-11,8,-8);s.bezierCurveTo(21,-7,24,7,20,18);s.bezierCurveTo(15,32,-22,30,-20,13);return s;},[]);
 return <>
 <NaturalTerrain/><BeachStones/>
 {Array.from({length:26},(_,i)=><mesh key={i} position={[-16+Math.sin(i*.9)*1.5,.03,-4+i*.85]} scale={[.5+i%3*.2,.25,.4]} rotation={[i*.3,i,0]} castShadow receiveShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#aaa58a':'#c0b79a'} roughness={1}/></mesh>)}
 <group position={[-3,-.1,-8]}>{Array.from({length:16},(_,i)=><Box key={i} position={[0,.28,-i*.38]} size={[2.1,.12,.33]} color={i%3?'#ac9871':'#95805d'}/>)}{[-1,1].map(s=>[0,1,2].map(i=><Beam key={`${s}-${i}`} a={[s,.8,-i*2.5]} b={[s,-.8,-i*2.5]} r={.09} color="#776950"/>))}</group>
 {[-1,1].map((s,i)=><mesh key={i} position={[s*110,-1,-170-i*35]} scale={[65,9,15]}><sphereGeometry args={[1,24,10]}/><meshStandardMaterial color={new Color('#83a8a4')} roughness={1}/></mesh>)}
 </>;
}
export function Penero(){
 const ref=useRef<Group>(null),time=useRef(0);
 const hull=useMemo(()=>{const s=new Shape();s.moveTo(0,-2);s.bezierCurveTo(-.8,-1.6,-.8,.8,-.52,1.65);s.quadraticCurveTo(0,1.8,.52,1.65);s.bezierCurveTo(.8,.8,.8,-1.6,0,-2);return s;},[]);
 useFrame((_,dt)=>{if(journey.paused||journey.reduced)return;time.current+=dt;if(ref.current){ref.current.position.y=Math.sin(time.current*.9)*.045-.04;ref.current.rotation.z=Math.sin(time.current*.65)*.025;}});
 return <group ref={ref} position={[-4,-.04,-12.5]} rotation={[0,1.1,0]}>
 <mesh rotation={[Math.PI/2,0,0]} castShadow><extrudeGeometry args={[hull,{depth:.48,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:2,steps:1}]}/><meshStandardMaterial color="#da8a51" roughness={.8}/></mesh>
 <mesh rotation={[Math.PI/2,0,0]} position={[0,.05,0]} scale={[.83,.89,1]}><shapeGeometry args={[hull]}/><meshStandardMaterial color="#467e86" side={2}/></mesh>
 {[-.9,0,.9].map(z=><Box key={z} position={[0,.12,z]} size={[1.12,.09,.26]} color="#f0d9a4"/>)}
 {[-1,1].map(s=>[-1,1].map(z=><Beam key={`${s}${z}`} a={[s*.55,.1,z]} b={[s*.55,1.45,z]} r={.026} color="#f2dca9"/>))}
 <Box position={[0,1.48,0]} size={[1.4,.065,2.4]} rotation={[0,0,.025]} color="#f0dfb6"/><Box position={[0,.2,1.65]} size={[.32,.55,.32]} color="#4c5b51"/>
 </group>;
}
