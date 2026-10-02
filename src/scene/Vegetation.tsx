import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Group } from 'three';
import { Beam } from './Primitives';
import { journey } from '../data/journey';
import { NaturalShrub as Shrub } from './Botanical';
export { Shrub };
const rand=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

function PalmFronds({ seed=0 }: {seed?:number}) {
 const geometry=useMemo(()=>{
  const positions:number[]=[];const normals:number[]=[]; const indices:number[]=[];
  for(let f=0;f<11;f++) {
   const angle=f*Math.PI*2/11+seed, length=3.3+rand(f+seed)*1.2;
   for(let s=1;s<22;s++) {
    const t=s/22,r=t*length,h=Math.sin(t*Math.PI)*.95-t*t*1.3;
    const width=Math.sin(t*Math.PI)*.88;
    for(const side of [-1,1]){
     const idx=positions.length/3,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
     for(let k=0;k<=7;k++){const q=k/7,w=Math.sin(q*Math.PI)*.065;for(const edge of [-1,1]){positions.push(x+Math.sin(angle)*width*side*q+Math.cos(angle)*(.28*q+w*edge),h-.32*q*q+Math.sin(q*Math.PI)*.04,z-Math.cos(angle)*width*side*q+Math.sin(angle)*(.28*q+w*edge));normals.push(0,1,0);}if(k<7){const n=idx+k*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    }
   }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('normal',new Float32BufferAttribute(normals,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[seed]);
 return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#447451" roughness={.85} side={2}/></mesh>;
}
export function Palm({position,scale=1,seed=0}:{position:[number,number,number];scale?:number;seed?:number}) {
 const crown=useRef<Group>(null);
 useFrame(({clock})=>{if(crown.current&&!journey.paused&&!journey.reduced){crown.current.rotation.z=Math.sin(clock.elapsedTime*.6+seed)*.025;crown.current.rotation.y=Math.sin(clock.elapsedTime*.3+seed)*.035;}});
 return <group position={position} scale={scale}>
 {Array.from({length:10},(_,i)=><Beam key={i} a={[i*i*.005,i*.56,0]} b={[(i+1)*(i+1)*.005,(i+1)*.56,0]} r={.17-i*.005} color={i%2?'#9a8060':'#897455'}/>)}
 <group ref={crown} position={[.5,5.6,0]}><PalmFronds seed={seed}/>{[0,1,2].map(i=><mesh key={i} position={[Math.cos(i*2)*.2,-.17,Math.sin(i*2)*.2]} castShadow><sphereGeometry args={[.18,7,5]}/><meshStandardMaterial color="#766345"/></mesh>)}</group>
 </group>;
}
export function SeaGrape({position,scale=1,seed=0}:{position:[number,number,number];scale?:number;seed?:number}){
 return <group position={position} scale={scale}><Beam a={[0,0,0]} b={[.2,3.5,0]} r={.19}/><Beam a={[.1,2,0]} b={[-1.9,4,.2]} r={.1}/><Beam a={[.1,2.7,0]} b={[1.8,4.4,0]} r={.1}/><Shrub position={[-1.5,3.5,0]} scale={1.9} seed={seed}/><Shrub position={[1.2,3.7,0]} scale={1.9} seed={seed+8}/><Shrub position={[0,4.4,0]} scale={1.8} seed={seed+4}/></group>;
}
export function TropicalGarden(){return <>
 {([[-7,0,12,1.5], [7,0,11,1.35],[-12,0,4,1.3],[12,0,0,1.6],[-11,0,-3,1.1],[3,0,-6,1.1],[11,0,8,1.2],[-14,0,12,1.25]] as number[][]).map((p,i)=><Palm key={i} position={[p[0],p[1],p[2]]} scale={p[3]} seed={i*3}/>)}
 <SeaGrape position={[-4,0,14]} scale={1.1}/><SeaGrape position={[5,0,15]} scale={1.15} seed={11}/>
 {Array.from({length:26},(_,i)=>{const side=i%2?1:-1;return <Shrub key={i} position={[side*(9+rand(i+22)*5),0,-5+rand(i+50)*22]} scale={.9+rand(i+90)*1.3} seed={i*5}/>;})}
 <Shrub position={[-2,0,11]} scale={1.3} seed={12}/><Shrub position={[3,0,10]} scale={1.3} seed={24}/>
 <Shrub position={[-9,2.8,0]} scale={1.1} seed={15} flowers/><Shrub position={[3.4,3.7,-2.7]} scale={1.1} seed={26} flowers/>
 </>;}

