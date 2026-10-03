import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Color, DoubleSide, Group, Shape, SRGBColorSpace } from 'three';
import { Box, Beam } from './Primitives';
import { journey } from '../data/journey';
import { NaturalTerrain, BeachStones, Cays } from './Terrain';
import { BOATS } from '../data/world';
export function Island(){
 const shape=useMemo(()=>{const s=new Shape();s.moveTo(-20,13);s.bezierCurveTo(-24,1,-15,-8,-8,-8);s.bezierCurveTo(-2,-7,1,-11,8,-8);s.bezierCurveTo(21,-7,24,7,20,18);s.bezierCurveTo(15,32,-22,30,-20,13);return s;},[]);
 return <>
 <NaturalTerrain/><Cays/><BeachStones/>
 {Array.from({length:26},(_,i)=><mesh key={i} position={[-16+Math.sin(i*.9)*1.5,.03,-4+i*.85]} scale={[.5+i%3*.2,.25,.4]} rotation={[i*.3,i,0]} castShadow receiveShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#aaa58a':'#c0b79a'} roughness={1}/></mesh>)}
 <group position={[-3,-.1,-8]}>{Array.from({length:16},(_,i)=><Box key={i} position={[0,.28,-i*.38]} size={[2.1,.12,.33]} color={i%3?'#ac9871':'#95805d'}/>)}{[-1,1].map(s=>[0,1,2].map(i=><Beam key={`${s}-${i}`} a={[s,.8,-i*2.5]} b={[s,-.8,-i*2.5]} r={.09} color="#776950"/>))}</group>
 {[-1,1].map((s,i)=><mesh key={i} position={[s*110,-1,-170-i*35]} scale={[65,9,15]}><sphereGeometry args={[1,24,10]}/><meshStandardMaterial color={new Color('#83a8a4')} roughness={1}/></mesh>)}
 </>;
}
export function Peneros(){return <>{BOATS.map((b,i)=><Penero key={i} x={b.x} z={b.z} ang={b.ang} hull={b.hull} trim={b.trim} name={b.name} paint={b.paint} phase={i*1.7}/>)}</>;}
// Hand-painted boat name, as on the peñeros of Margarita and Choroní.
function nameTexture(name:string,paint:string){
 const c=document.createElement('canvas');c.width=512;c.height=128;const k=c.getContext('2d')!;
 k.font='76px "Caveat Brush", "Segoe Script", cursive';k.textAlign='center';k.textBaseline='middle';
 k.fillStyle='rgba(0,0,0,.25)';k.fillText(name,259,70);k.fillStyle=paint;k.fillText(name,256,66);
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.anisotropy=4;
 // The web font may arrive after the first draw; repaint once it is ready.
 document.fonts?.load('76px "Caveat Brush"').then(()=>{k.clearRect(0,0,512,128);k.fillStyle='rgba(0,0,0,.25)';k.fillText(name,259,70);k.fillStyle=paint;k.fillText(name,256,66);t.needsUpdate=true;}).catch(()=>{});
 return t;
}
export function Penero({x,z,ang,hull:hullColor,trim,phase,name,paint='#fbf7ee'}:{x:number;z:number;ang:number;hull:string;trim:string;phase:number;name?:string;paint?:string}){
 const label=useMemo(()=>name?nameTexture(name,paint):null,[name,paint]);
 const ref=useRef<Group>(null),time=useRef(phase);
 const hull=useMemo(()=>{const s=new Shape();s.moveTo(0,-2);s.bezierCurveTo(-.8,-1.6,-.8,.8,-.52,1.65);s.quadraticCurveTo(0,1.8,.52,1.65);s.bezierCurveTo(.8,.8,.8,-1.6,0,-2);return s;},[]);
 useFrame((_,dt)=>{if(journey.paused||journey.reduced)return;time.current+=dt;if(ref.current){ref.current.position.y=Math.sin(time.current*.9)*.045-.04;ref.current.rotation.z=Math.sin(time.current*.65)*.025;}});
 return <group ref={ref} position={[x,-.04,z]} rotation={[0,ang,0]}>
 <mesh rotation={[Math.PI/2,0,0]} castShadow><extrudeGeometry args={[hull,{depth:.48,bevelEnabled:true,bevelSize:.09,bevelThickness:.09,bevelSegments:2,steps:1}]}/><meshStandardMaterial color={hullColor} roughness={.8}/></mesh>
 <mesh rotation={[Math.PI/2,0,0]} position={[0,.05,0]} scale={[.83,.89,1]}><shapeGeometry args={[hull]}/><meshStandardMaterial color={trim} side={2}/></mesh>
 {[-.9,0,.9].map(z=><Box key={z} position={[0,.12,z]} size={[1.12,.09,.26]} color="#f0d9a4"/>)}
 {[-1,1].map(s=>[-1,1].map(z=><Beam key={`${s}${z}`} a={[s*.55,.1,z]} b={[s*.55,1.45,z]} r={.026} color="#f2dca9"/>))}
 {label&&[-1,1].map(s=><mesh key={s} position={[s*.8,-.2,.25]} rotation={[0,s*Math.PI/2,0]}><planeGeometry args={[1.5,.375]}/><meshStandardMaterial map={label} transparent side={DoubleSide} roughness={.9} polygonOffset polygonOffsetFactor={-2}/></mesh>)}
 <Box position={[0,1.48,0]} size={[1.4,.065,2.4]} rotation={[0,0,.025]} color="#f0dfb6"/><Box position={[0,.2,1.65]} size={[.32,.55,.32]} color="#4c5b51"/>
 </group>;
}
