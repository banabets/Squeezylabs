import { LowPolyPalm as Palm, LowPolyShrub as Shrub } from './LowPoly';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Group } from 'three';
import { Beam } from './Primitives';
import { journey } from '../data/journey';
import { MangoTree } from './Mango';
import { Hammock } from './Extras';
import { CAYS, mainPoint } from '../data/world';
export { Shrub };
const rand=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

export { Palm };
export function SeaGrape({position,scale=1,seed=0}:{position:[number,number,number];scale?:number;seed?:number}){
 return <group position={position} scale={scale}><Beam a={[0,0,0]} b={[.2,3.5,0]} r={.19}/><Beam a={[.1,2,0]} b={[-1.9,4,.2]} r={.1}/><Beam a={[.1,2.7,0]} b={[1.8,4.4,0]} r={.1}/><Shrub position={[-1.5,3.5,0]} scale={1.9} seed={seed}/><Shrub position={[1.2,3.7,0]} scale={1.9} seed={seed+8}/><Shrub position={[0,4.4,0]} scale={1.8} seed={seed+4}/></group>;
}
// Palms leaning out over the water, around the main island and on the cays.
const leaning=[.2,1.05,1.75,2.45,3.3,4.6].map((a,i)=>{const [x,z]=mainPoint(a,.9);return {x,z,yaw:-a,lean:.42+(i%3)*.08};});
const cayPalms=CAYS.flatMap((c,i)=>[0,1,2].slice(0,i===1?1:3).map(k=>{const a=k*2.1+i;return {x:c.x+Math.cos(a)*c.rx*.35,z:c.z+Math.sin(a)*c.rz*.35,yaw:-a,lean:.12+k*.08};}));
export function TropicalGarden(){return <>
 {([[-7,0,12,1.5], [7,0,11,1.35],[-12,0,4,1.3],[12,0,0,1.6],[-11,0,-3,1.1],[3,0,-6,1.1],[-14,0,12,1.25],[-10.5,0,14.2,1.3]] as number[][]).map((p,i)=><Palm key={i} position={[p[0],p[1],p[2]]} scale={p[3]} seed={i*3}/>)}
 {leaning.map((p,i)=><Palm key={'l'+i} position={[p.x,0,p.z]} yaw={p.yaw} lean={p.lean} scale={1.25} seed={40+i*3}/>)}
 {cayPalms.map((p,i)=><Palm key={'c'+i} position={[p.x,0,p.z]} yaw={p.yaw} lean={p.lean} scale={1.15} seed={70+i*3}/>)}
 <Hammock a={[-7.05,1.55,12]} b={[-10.45,1.55,14.2]}/>
 {Array.from({length:26},(_,i)=>{const side=i%2?1:-1,x=side*(9+rand(i+22)*5),z=-5+rand(i+50)*22;if(side>0&&z>-4)return null;return <Shrub key={i} position={[x,0,z]} scale={.9+rand(i+90)*1.3} seed={i*5}/>;})}
 <MangoTree position={[6.2,10.2]} seed={5} scale={.62}/>
 <Shrub position={[-9,2.8,0]} scale={1.1} seed={15} flowers/><Shrub position={[3.4,3.7,-2.7]} scale={1.1} seed={26} flowers/>
 </>;}


