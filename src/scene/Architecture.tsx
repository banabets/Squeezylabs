import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3 } from 'three';
import { RoundedBox } from '@react-three/drei';
import { Box, Beam } from './Primitives';
import { flat, PALETTE } from './flat';
import { ArcadeScreen, ProjectScreen } from './Screens';
import { Shrub } from './Vegetation';
import { journey } from '../data/journey';
import { ColonialHouse } from './Colonial';
import { Clothesline } from './Cloth';
type V=[number,number,number];
export function Fabric({position,rotation=0}:{position:V;rotation?:number}){
 const ref=useRef<Mesh>(null);
 useFrame(({clock})=>{if(!ref.current||journey.paused||journey.reduced)return;const attr=ref.current.geometry.attributes.position;for(let i=0;i<attr.count;i++){const y=attr.getY(i);attr.setZ(i,Math.sin(attr.getX(i)*4+clock.elapsedTime*1.2+y)*.10*(1.25-y));}attr.needsUpdate=true;ref.current.geometry.computeVertexNormals();});
 return <mesh ref={ref} position={position} rotation={[0,rotation,0]} castShadow><planeGeometry args={[1.1,2.4,10,16]}/><meshStandardMaterial color="#f4eacb" side={2} roughness={1}/></mesh>;
}
function Shutter({position,color='#5b9d94'}:{position:V;color?:string}){return <group position={position}><Box size={[1.05,1.45,.09]} color={color}/>{Array.from({length:10},(_,i)=><Box key={i} position={[0,-.62+i*.14,.07]} size={[.95,.065,.1]} rotation={[.2,0,0]} color={color}/>)}<Box position={[0,0,.12]} size={[.055,1.5,.04]} color="#315b54"/></group>;}
// Studio cottages in the coastal colonial style, with an open portico so the arcade and desk stay visible.
function Cottage({position,color,width=5,depth=4,zocalo='#2f6f9e'}:{position:V;color:string;width?:number;depth?:number;zocalo?:string}){return <group position={position}>
 <ColonialHouse position={[0,0,depth/2]} width={width} depth={depth} wall={color} zocalo={zocalo} portico seed={Math.round(width*10)}/>
 <mesh position={[0,.32,.2]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[width*.7,depth*.62]}/><meshStandardMaterial color="#c9a678" roughness={1} flatShading/></mesh>
 </group>;}
function Chair({position,rotation=0}:{position:V;rotation?:number}){return <group position={position} rotation={[0,rotation,0]}>{[-1,1].map(s=>[-1,1].map(z=><Box key={`${s}${z}`} position={[s*.3,.4,z*.29]} size={[.055,.8,.055]} color="#72543e"/>))}<Box position={[0,.76,0]} size={[.72,.08,.65]} color="#ab7c50"/>{[-1,1].map(s=><Box key={s} position={[s*.3,1.02,-.29]} size={[.05,.9,.06]} color="#72543e"/>)}{[0,1,2].map(i=><Box key={i} position={[0,1.06+i*.14,-.29]} size={[.65,.10,.04]} color="#ab7c50"/>)}</group>;}
export function StudioDetails(){return <>
 <Clothesline x0={10.3} x1={13.1} z={-3.7} colors={['#2e8d86','#c4dceb']}/>
 </>;}
function Pot({position,scale=1}:{position:V;scale?:number}){return <group position={position} scale={scale}><mesh position={[0,.35,0]} castShadow material={flat(PALETTE.terracotta)}><cylinderGeometry args={[.4,.26,.7,8]}/></mesh><Shrub position={[0,.6,0]} scale={.55} seed={7}/></group>;}
function Arcade({onSelect}:{onSelect:()=>void}){return <group position={[-7,.33,.3]} rotation={[0,.16,0]}>
 <RoundedBox args={[1.25,1.9,.85]} radius={.08} smoothness={2} position={[0,.95,0]} castShadow material={flat('#de8c69')}/>
 <Box position={[0,1.5,.46]} size={[1.01,.77,.07]} color="#263f38"/>
 <ArcadeScreen size={[.86,.6]} position={[0,1.51,.505]} onSelect={onSelect}/>
 
 <Box position={[0,.91,.57]} size={[1.12,.15,.5]} rotation={[.12,0,0]} color="#f4ba80"/>
 <Beam a={[-.3,1,.66]} b={[-.3,1.17,.66]} r={.035} color="#263f38"/><mesh position={[-.3,1.2,.66]}><sphereGeometry args={[.075,12,8]}/><meshStandardMaterial color="#496b56"/></mesh>
 {[0,1,2].map(i=><mesh key={i} position={[.1+i*.16,1,.65]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.055,.055,.04,12]}/><meshStandardMaterial color={i===1?'#629c95':'#f7e9be'}/></mesh>)}
 </group>;}
export function GamesArea({onSelect}:{onSelect:()=>void}){return <><Cottage position={[-7,0,-1]} color="#f0cdb4" zocalo="#2e6f6a" width={4.7} depth={4}/><Arcade onSelect={onSelect}/><Pot position={[-9.7,0,1.5]}/><Pot position={[-4.4,0,.3]} scale={1.2}/><Box position={[-7,.22,2]} size={[4.8,.16,.8]} color="#d0b995"/></>;}
export function WebAppsArea({onSelect}:{onSelect:()=>void}){return <>
 <Cottage position={[6,0,-3]} color="#f3ead8" width={5.7} depth={4.2}/>
 <group position={[6,.4,-2.2]}>
 <Box position={[0,.95,0]} size={[3.2,.15,1.1]} color="#b58a5d"/>{[-1,1].map(s=><Box key={s} position={[s*1.3,.46,0]} size={[.12,.95,.65]} color="#6e6145"/>)}
 <Box position={[0,1.6,0]} size={[1.65,1.05,.12]} color="#385d52"/><Box position={[0,1.06,0]} size={[.13,.3,.12]} color="#385d52"/>
 <ProjectScreen size={[1.48,.88]} position={[0,1.6,.075]} cycle onSelect={onSelect}/>
 <Box position={[1.15,1.35,.18]} size={[.38,.6,.08]} color="#385d52"/><ProjectScreen size={[.3,.49]} position={[1.15,1.35,.23]} reel={2}/>
 </group><Fabric position={[3.65,1.95,-.8]}/><Pot position={[9.3,0,-.9]} scale={1.3}/>
 </>;}
export function CoastalEntrance(){return <>
 {[-1,1].map(side=><group key={side}><Box position={[side*2.1,1.8,3.6]} size={[.18,3.6,.18]} color="#857554"/><Box position={[side*2.1,1.8,-.4]} size={[.18,3.6,.18]} color="#857554"/></group>)}
 {[0,1,2,3,4,5,6,7,8].map(i=><Box key={i} position={[0,3.65,-.6+i*.55]} size={[4.65,.13,.17]} color="#99815c"/>)}
 <Box position={[-2.1,3.52,1.5]} size={[.13,.16,4.5]} color="#73634b"/><Box position={[2.1,3.52,1.5]} size={[.13,.16,4.5]} color="#73634b"/>
 <Shrub position={[-2.2,3.55,1]} scale={1} seed={22} flowers/>
 <Fabric position={[2.06,2,1.9]} rotation={Math.PI/2}/>
 </>;}
export function ExperimentLab({onSelect}:{onSelect:()=>void}){
 const blob=useRef<Mesh>(null);const t=useRef(0);
 useFrame((_,dt)=>{if(journey.paused||journey.reduced)return;t.current+=dt;if(blob.current){blob.current.scale.lerp(new Vector3(1+Math.sin(t.current)*.08,1-Math.sin(t.current)*.06,1),.1);blob.current.rotation.y=t.current*.18;}});
 return <group position={[9,0,3]}><mesh position={[0,.4,0]} receiveShadow><cylinderGeometry args={[1.3,1.5,.7,32]}/><meshStandardMaterial color="#c3b497" roughness={.9}/></mesh>
 <mesh ref={blob} position={[0,1.6,0]} castShadow onClick={onSelect} onPointerOver={()=>document.body.style.cursor='pointer'} onPointerOut={()=>document.body.style.cursor='auto'}><torusKnotGeometry args={[.56,.23,90,12,2,3]}/><meshStandardMaterial color="#d9eb89" roughness={.43}/></mesh>
 <mesh position={[0,.82,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.94,.02,8,40]}/><meshStandardMaterial color="#668578" metalness={.3}/></mesh><Pot position={[1.7,0,-.6]}/>
 </group>;
}

