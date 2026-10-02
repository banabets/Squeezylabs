import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, Vector3 } from 'three';
import { RoundedBox } from '@react-three/drei';
import { Box, Beam } from './Primitives';
import { Shrub } from './Vegetation';
import { journey } from '../data/journey';
import { TiledRoof } from './RoofTiles';
type V=[number,number,number];
export function Fabric({position,rotation=0}:{position:V;rotation?:number}){
 const ref=useRef<Mesh>(null);
 useFrame(({clock})=>{if(!ref.current||journey.paused||journey.reduced)return;const attr=ref.current.geometry.attributes.position;for(let i=0;i<attr.count;i++){const y=attr.getY(i);attr.setZ(i,Math.sin(attr.getX(i)*4+clock.elapsedTime*1.2+y)*.10*(1.25-y));}attr.needsUpdate=true;ref.current.geometry.computeVertexNormals();});
 return <mesh ref={ref} position={position} rotation={[0,rotation,0]} castShadow><planeGeometry args={[1.1,2.4,10,16]}/><meshStandardMaterial color="#f4eacb" side={2} roughness={1}/></mesh>;
}
function Shutter({position,color='#5b9d94'}:{position:V;color?:string}){return <group position={position}><Box size={[1.05,1.45,.09]} color={color}/>{Array.from({length:10},(_,i)=><Box key={i} position={[0,-.62+i*.14,.07]} size={[.95,.065,.1]} rotation={[.2,0,0]} color={color}/>)}<Box position={[0,0,.12]} size={[.055,1.5,.04]} color="#315b54"/></group>;}
function Cottage({position,color,width=5,depth=4}:{position:V;color:string;width?:number;depth?:number}){return <group position={position}>
 <Box position={[0,.15,0]} size={[width+.8,.3,depth+.8]} color="#baad90"/>
 <Box position={[0,1.9,-depth/2]} size={[width,3.4,.23]} color={color}/>
 <Box position={[-width/2,1.9,-depth*.16]} size={[.2,3.4,depth*.68]} color={color}/><Box position={[width/2,1.9,-depth*.16]} size={[.2,3.4,depth*.68]} color={color}/>
 <Box position={[0,3.3,depth/2]} size={[width,.65,.18]} color={color}/>
 {[-1,1].map(s=><Box key={s} position={[s*(width/2-.28),1.7,depth/2]} size={[.16,3.2,.16]} color="#754c37"/>)}
 <TiledRoof width={width} depth={depth}/>
 <Box position={[0,.5,-depth/2+.16]} size={[width,.22,.16]} color="#b4aa89"/>
 {[-1,1].map(s=><group key={`trim${s}`}><Box position={[s*(width/2-.04),1.85,-depth/2+.15]} size={[.19,3.5,.22]} color="#f2e7c8"/><Box position={[s*(width/2-.34),3.03,depth/2-.25]} size={[.13,.6,.13]} rotation={[0,0,s*.7]} color="#755443"/><group position={[s*(width/2-.25),1.8,depth/2]} rotation={[0,s*.4,0]}><Shutter position={[0,0,0]}/></group></group>)}
 <Shutter position={[-1.3,1.8,-depth/2+.16]}/><Shutter position={[1.3,1.8,-depth/2+.16]}/>
 {Array.from({length:12},(_,i)=><Box key={`siding${i}`} position={[0,.45+i*.24,-depth/2+.125]} size={[width,.018,.012]} color="#c6aa81"/>)}
 <Box position={[0,.02,depth/2+.3]} size={[width+.6,.12,1.2]} color="#c5b792"/>
 <mesh position={[0,.32,.2]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[width*.7,depth*.62]}/><meshStandardMaterial color="#ab8961" roughness={1}/></mesh>
 {Array.from({length:9},(_,i)=><Box key={`rug${i}`} position={[-width*.32+i*width*.08,.33,.2]} size={[.03,.008,depth*.6]} color="#ded0a4"/>)}
 <Beam a={[0,3.45,.4]} b={[0,2.95,.4]} r={.018} color="#3d5145"/><mesh position={[0,2.85,.4]}><sphereGeometry args={[.2,12,8]}/><meshStandardMaterial color="#efe4b0" emissive="#efcc74" emissiveIntensity={.2} roughness={.8}/></mesh>
 {Array.from({length:7},(_,i)=><Box key={i} position={[-width/2+i*width/6,.32,0]} size={[.026,.035,depth]} color="#8e8063"/>)}
 </group>;}
function Chair({position,rotation=0}:{position:V;rotation?:number}){return <group position={position} rotation={[0,rotation,0]}>{[-1,1].map(s=>[-1,1].map(z=><Box key={`${s}${z}`} position={[s*.3,.4,z*.29]} size={[.055,.8,.055]} color="#72543e"/>))}<Box position={[0,.76,0]} size={[.72,.08,.65]} color="#ab7c50"/>{[-1,1].map(s=><Box key={s} position={[s*.3,1.02,-.29]} size={[.05,.9,.06]} color="#72543e"/>)}{[0,1,2].map(i=><Box key={i} position={[0,1.06+i*.14,-.29]} size={[.65,.10,.04]} color="#ab7c50"/>)}</group>;}
export function StudioDetails(){return <>
 <group position={[-4.4,0,7]} rotation={[0,-.3,0]}>
 <mesh position={[0,.88,0]} castShadow receiveShadow><cylinderGeometry args={[.75,.75,.09,32]}/><meshStandardMaterial color="#6b9c91" roughness={.8}/></mesh>
 <Beam a={[-.4,0,-.4]} b={[.4,.85,.4]} r={.035} color="#525f49"/><Beam a={[.4,0,-.4]} b={[-.4,.85,.4]} r={.035} color="#525f49"/>
 <Box position={[.14,.95,0]} size={[.4,.05,.29]} rotation={[0,.3,0]} color="#dcb376"/>
 <mesh position={[-.3,1.02,.2]} castShadow><cylinderGeometry args={[.09,.07,.17,14]}/><meshStandardMaterial color="#ede2bc" roughness={.7}/></mesh>
 <Chair position={[1.2,0,.5]} rotation={-1.9}/><Chair position={[-1.2,0,.3]} rotation={1.7}/>
 </group>
 <Chair position={[6,.34,-1.15]} rotation={Math.PI}/>
 <group position={[-8.5,.36,-1.7]}><Box position={[0,.65,0]} size={[.9,.08,.7]} color="#b59466"/>{[-1,1].map(s=><Box key={s} position={[s*.35,.3,0]} size={[.08,.6,.5]} color="#796544"/>)}<Box position={[0,.75,0]} size={[.4,.08,.3]} color="#74a098"/><Box position={[.02,.82,.01]} size={[.34,.05,.27]} color="#dcb37c"/></group>
 <group position={[11,0,-4]}><Beam a={[0,0,0]} b={[0,2,0]} r={.05}/><Beam a={[2,0,0]} b={[2,2,0]} r={.05}/><Beam a={[0,1.9,0]} b={[2,1.9,0]} r={.016}/><group scale={[.65,.55,.65]}><Fabric position={[.9,2.12,0]}/><Fabric position={[2.3,2.12,0]}/></group></group>
 </>;}
function Pot({position,scale=1}:{position:V;scale?:number}){return <group position={position} scale={scale}><mesh position={[0,.35,0]} castShadow><cylinderGeometry args={[.4,.26,.7,14]}/><meshStandardMaterial color="#b96e4e" roughness={.92}/></mesh><Shrub position={[0,.6,0]} scale={.55} seed={7}/></group>;}
function Arcade({onSelect}:{onSelect:()=>void}){return <group position={[-7,.33,.3]} rotation={[0,.16,0]}>
 <RoundedBox args={[1.25,1.9,.85]} radius={.1} position={[0,.95,0]} castShadow><meshStandardMaterial color="#de8c69" roughness={.6}/></RoundedBox>
 <Box position={[0,1.5,.46]} size={[1.01,.77,.07]} color="#263f38"/>
 <mesh position={[0,1.51,.505]} onClick={e=>{e.stopPropagation();onSelect();}} onPointerOver={()=>document.body.style.cursor='pointer'} onPointerOut={()=>document.body.style.cursor='auto'}><planeGeometry args={[.86,.6]}/><meshBasicMaterial color="#d6f585"/></mesh>
 {[-1,1].map(i=><Box key={i} position={[i*.18,1.58,.55]} size={[.11,.13,.04]} color="#284936"/>)}<Box position={[0,1.37,.55]} size={[.3,.035,.04]} color="#284936"/>
 <Box position={[0,.91,.57]} size={[1.12,.15,.5]} rotation={[.12,0,0]} color="#f4ba80"/>
 <Beam a={[-.3,1,.66]} b={[-.3,1.17,.66]} r={.035} color="#263f38"/><mesh position={[-.3,1.2,.66]}><sphereGeometry args={[.075,12,8]}/><meshStandardMaterial color="#496b56"/></mesh>
 {[0,1,2].map(i=><mesh key={i} position={[.1+i*.16,1,.65]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.055,.055,.04,12]}/><meshStandardMaterial color={i===1?'#629c95':'#f7e9be'}/></mesh>)}
 </group>;}
export function GamesArea({onSelect}:{onSelect:()=>void}){return <><Cottage position={[-7,0,-1]} color="#dc9b7b" width={4.7} depth={4}/><Arcade onSelect={onSelect}/><Pot position={[-9.7,0,1.5]}/><Pot position={[-4.4,0,.3]} scale={1.2}/><Box position={[-7,.22,2]} size={[4.8,.16,.8]} color="#d0b995"/></>;}
export function WebAppsArea({onSelect}:{onSelect:()=>void}){return <>
 <Cottage position={[6,0,-3]} color="#e7d7ac" width={5.7} depth={4.2}/>
 <group position={[6,.4,-2.2]}>
 <Box position={[0,.95,0]} size={[3.2,.15,1.1]} color="#b58a5d"/>{[-1,1].map(s=><Box key={s} position={[s*1.3,.46,0]} size={[.12,.95,.65]} color="#6e6145"/>)}
 <Box position={[0,1.6,0]} size={[1.65,1.05,.12]} color="#385d52"/><Box position={[0,1.06,0]} size={[.13,.3,.12]} color="#385d52"/>
 <mesh position={[0,1.6,.075]} onClick={onSelect} onPointerOver={()=>document.body.style.cursor='pointer'} onPointerOut={()=>document.body.style.cursor='auto'}><planeGeometry args={[1.48,.88]}/><meshBasicMaterial color="#f5edcc"/></mesh>
 <Box position={[-.39,1.6,.09]} size={[.52,.65,.01]} color="#a4c1a4"/>{[0,1,2].map(i=><Box key={i} position={[.28,1.82-i*.18,.1]} size={[.56,.055,.01]} color={i===0?'#d98c67':'#8aa590'}/>)}
 <Box position={[1.15,1.35,.18]} size={[.38,.6,.08]} color="#385d52"/><Box position={[1.15,1.35,.23]} size={[.3,.49,.01]} color="#c6d68c"/>
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

