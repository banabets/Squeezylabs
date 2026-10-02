import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, RoundedBox } from '@react-three/drei';
import { Group, Vector2, SRGBColorSpace, MathUtils } from 'three';
import { journey } from '../data/journey';

const lime='#a8ed00';
/** A real object in the coastal scene: arrival, working hover, and a distant final cameo. */
export function Visitor({onSelect}:{onSelect:()=>void}) {
 const ship=useRef<Group>(null),head=useRef<Group>(null),time=useRef(0);
 const logo=useTexture('/brand/squeezy.png');logo.colorSpace=SRGBColorSpace;
 const profile=useMemo(()=>[[0,-.3],[.55,-.34],[1.25,-.2],[1.85,-.04],[2,.06],[1.83,.18],[1.2,.35],[.72,.46],[0,.46]].map(([x,y])=>new Vector2(x,y)),[]);
 useFrame(({size},dt)=>{
  if(!journey.paused&&!journey.reduced)time.current+=Math.min(dt,.05);
  const t=time.current,enter=journey.reduced?1:MathUtils.smoothstep(t,1.5,5),p=journey.rendered;
  if(ship.current){
   const away=MathUtils.smoothstep(p,.12,.3);
   ship.current.position.set((size.width<700?-.1:.6)+away*10,2.5+(1-enter)*12+away*1.2+Math.sin(t*.85)*.09,9-(1-enter)*40-away*11);
   ship.current.rotation.set(Math.sin(t*.6)*.025,-.18+away*.6,Math.sin(t*.8)*.025);
   ship.current.scale.setScalar(size.width<700?.6:.75);
  }
  if(head.current){head.current.rotation.y=Math.sin(t*.4)*.12;head.current.rotation.x=-.12+MathUtils.smoothstep(t,4,6)*.18;}
 });
 return <group ref={ship} onClick={e=>{e.stopPropagation();onSelect();}}>
  <mesh castShadow receiveShadow><latheGeometry args={[profile,64]}/><meshPhysicalMaterial color="#233737" metalness={.78} roughness={.28} clearcoat={1}/></mesh>
  <mesh rotation={[Math.PI/2,0,0]} position={[0,.08,0]}><torusGeometry args={[1.89,.035,8,64]}/><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={2}/></mesh>
  <mesh position={[0,-.3,0]} scale={[1,.15,1]}><sphereGeometry args={[.75,24,12]}/><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={1.5}/></mesh>
  {[-1,1].map(s=><mesh key={s} position={[s*1.34,.21,.55]} rotation={[-.15,0,s*-.14]} castShadow><boxGeometry args={[.35,.08,.7]}/><meshStandardMaterial color="#b1bdb0" metalness={.7} roughness={.32}/></mesh>)}
  <group position={[0,.36,0]}>
   <mesh position={[0,.42,0]} scale={[.43,.57,.32]} castShadow><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color={lime} roughness={.27} clearcoat={1}/></mesh>
   <group ref={head} position={[0,1.03,.05]}>
    <mesh scale={[.49,.6,.38]} castShadow><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial color={lime} roughness={.22} clearcoat={1} emissive="#597000" emissiveIntensity={.12}/></mesh>
    {[-1,1].map(s=><group key={s} position={[s*.23,.03,.31]} rotation={[0,s*.18,s*-.22]}>
     <mesh scale={[.155,.245,.073]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color="#041a18" roughness={.09} metalness={.2} clearcoat={1}/></mesh>
     <mesh position={[-.045,.08,.065]} scale={[.026,.055,.008]}><sphereGeometry args={[1,10,8]}/><meshBasicMaterial color="#efffd5"/></mesh>
    </group>)}
    <mesh position={[0,-.27,.34]} scale={[.09,.016,.016]}><sphereGeometry args={[1,16,8]}/><meshStandardMaterial color="#436622"/></mesh>
    <mesh rotation={[0,0,0]}><torusGeometry args={[.52,.045,8,32,Math.PI]}/><meshStandardMaterial color="#17282a" metalness={.5} roughness={.4}/></mesh>
    {[-1,1].map(s=><mesh key={s} position={[s*.48,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.14,.14,.1,20]}/><meshStandardMaterial color="#223638" metalness={.6} roughness={.3}/></mesh>)}
   </group>
   {[-1,1].map(s=><mesh key={s} position={[s*.35,.48,.32]} rotation={[.7,0,s*.4]} scale={[.1,.36,.1]} castShadow><sphereGeometry args={[1,16,12]}/><meshPhysicalMaterial color={lime} roughness={.3} clearcoat={1}/></mesh>)}
   <RoundedBox position={[0,.37,.62]} rotation={[-.25,0,0]} args={[1,.07,.5]} radius={.04}><meshStandardMaterial color="#111f24" metalness={.5} roughness={.35}/></RoundedBox>
   {Array.from({length:3},(_,i)=><mesh key={i} position={[0,.44+i*.025,.45+i*.12]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.7,.035]}/><meshBasicMaterial color={lime}/></mesh>)}
  </group>
  <mesh position={[0,.3,1.8]} rotation={[-.25,0,0]}><planeGeometry args={[.57,.57]}/><meshBasicMaterial map={logo} toneMapped={false}/></mesh>
  <mesh position={[0,.52,-.25]} scale={[1.04,.82,1.04]}><sphereGeometry args={[1,32,16,0,Math.PI*2,0,Math.PI/2]}/><meshPhysicalMaterial color="#90cbd0" transparent opacity={.12} roughness={.1} metalness={.15} depthWrite={false} side={2}/></mesh>
 </group>;
}



