import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, RoundedBox } from '@react-three/drei';
import { Group, Vector2, Vector3, CatmullRomCurve3, SphereGeometry, CanvasTexture, SRGBColorSpace, MathUtils } from 'three';
import { journey } from '../data/journey';

const lime='#a8ed00';
/** A real object in the coastal scene: arrival, working hover, and a distant final cameo. */
export function Visitor({onSelect}:{onSelect:()=>void}) {
 const ship=useRef<Group>(null),head=useRef<Group>(null),time=useRef(0);
 const logo=useTexture('/brand/squeezy.png');logo.colorSpace=SRGBColorSpace;
 const skin=useMemo(()=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#888';ctx.fillRect(0,0,128,128);let seed=31;for(let i=0;i<5000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%128;seed=(seed*1664525+1013904223)>>>0;const y=seed%128;ctx.fillStyle=i%2?'#949494':'#797979';ctx.fillRect(x,y,1,1);}return new CanvasTexture(c);},[]);
 const cranium=useMemo(()=>{const g=new SphereGeometry(1,40,28),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),jaw=y<-.05?.68+(y+1)*.30:1;p.setX(i,p.getX(i)*jaw);p.setZ(i,p.getZ(i)*(y<0?.82:1));}g.computeVertexNormals();return g;},[]);
 const profile=useMemo(()=>new CatmullRomCurve3([[0,-.3],[.55,-.34],[1.25,-.2],[1.85,-.04],[2,.06],[1.83,.18],[1.2,.35],[.72,.46],[0,.46]].map(([x,y])=>new Vector3(x,y,0))).getPoints(64).map(p=>new Vector2(Math.max(0,p.x),p.y)),[]);
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
  <mesh castShadow receiveShadow><latheGeometry args={[profile,64]}/><meshPhysicalMaterial color="#c3c7ba" metalness={.48} roughness={.32} clearcoat={.6}/></mesh>
  <mesh rotation={[Math.PI/2,0,0]} position={[0,.08,0]}><torusGeometry args={[2.005,.018,8,64]}/><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={.75}/></mesh>
  <mesh position={[0,-.3,0]} scale={[1,.15,1]}><sphereGeometry args={[.75,24,12]}/><meshStandardMaterial color={lime} emissive={lime} emissiveIntensity={1.5}/></mesh>
  {[-1,1].map(s=><mesh key={s} position={[s*1.34,.21,.55]} rotation={[-.15,0,s*-.14]} castShadow><boxGeometry args={[.35,.08,.7]}/><meshStandardMaterial color="#b1bdb0" metalness={.7} roughness={.32}/></mesh>)}
  <mesh position={[0,.43,-.05]} rotation={[Math.PI/2,0,0]} scale={[1, .95, 1]}><torusGeometry args={[.88,.035,10,48]}/><meshStandardMaterial color="#253532" metalness={.7} roughness={.32}/></mesh>
  {Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return <group key={i} position={[Math.sin(a)*1.986,.06,Math.cos(a)*1.986]} rotation={[0,a,0]}><mesh><boxGeometry args={[.16,.055,.012]}/><meshStandardMaterial color="#263130" roughness={.7} metalness={.5}/></mesh><mesh position={[0,.006,.011]}><boxGeometry args={[.095,.008,.006]}/><meshStandardMaterial color="#a6bb80" emissive="#9fce54" emissiveIntensity={.35}/></mesh></group>;})}
  <mesh position={[0,-.18,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.3,.025,8,64]}/><meshStandardMaterial color="#3b4540" metalness={.7} roughness={.4}/></mesh>
  <group position={[0,.36,0]}>
   <mesh position={[0,.42,0]} scale={[.32,.51,.25]} castShadow><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color="#263b36" roughness={.85} clearcoat={.08}/></mesh>
   <group ref={head} position={[0,1.03,.05]}>
    <mesh scale={[.36,.51,.31]} castShadow><primitive object={cranium} attach="geometry"/><meshPhysicalMaterial color={lime} bumpMap={skin} bumpScale={.008} roughness={.48} clearcoat={.18} emissive="#597000" emissiveIntensity={.12}/></mesh>
    {[-1,1].map(s=><group key={s} position={[s*.17,.04,.265]} rotation={[0,s*.18,s*-.22]}>
     <mesh scale={[.105,.17,.047]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial color="#041a18" roughness={.09} metalness={.2} clearcoat={1}/></mesh>
     <mesh position={[-.032,.065,.044]} scale={[.013,.025,.008]}><sphereGeometry args={[1,10,8]}/><meshBasicMaterial color="#efffd5"/></mesh>
    </group>)}
    <mesh position={[0,-.26,.277]} scale={[.09,.016,.016]}><sphereGeometry args={[1,16,8]}/><meshStandardMaterial color="#436622"/></mesh>
    <mesh rotation={[0,0,0]}><torusGeometry args={[.39,.027,8,32,Math.PI]}/><meshStandardMaterial color="#17282a" metalness={.5} roughness={.4}/></mesh>
    {[-1,1].map(s=><mesh key={s} position={[s*.355,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.10,.10,.06,20]}/><meshStandardMaterial color="#223638" metalness={.6} roughness={.3}/></mesh>)}
   </group>
   {[-1,1].map(s=><mesh key={s} position={[s*.35,.48,.32]} rotation={[.7,0,s*.4]} scale={[.1,.36,.1]} castShadow><sphereGeometry args={[1,16,12]}/><meshPhysicalMaterial color={lime} roughness={.3} clearcoat={1}/></mesh>)}
   <RoundedBox position={[0,.37,.62]} rotation={[-.25,0,0]} args={[1,.07,.5]} radius={.04}><meshStandardMaterial color="#111f24" metalness={.5} roughness={.35}/></RoundedBox>
   {Array.from({length:3},(_,i)=><mesh key={i} position={[0,.44+i*.025,.45+i*.12]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.7,.035]}/><meshBasicMaterial color={lime}/></mesh>)}
  </group>
  {[-1,1].map(s=><group key={'hand'+s} position={[s*.26,.79,.64]}>{Array.from({length:4},(_,i)=><mesh key={i} position={[(i-1.5)*.031,-i*.008,.02]} rotation={[.9,0,s*.12]} scale={[.017,.08,.019]}><sphereGeometry args={[1,10,8]}/><meshPhysicalMaterial color={lime} roughness={.5}/></mesh>)}</group>)}
  {[-1,1].map(s=><mesh key={'skid'+s} position={[s*.93,-.22,.18]} rotation={[0,0,s*.12]}><boxGeometry args={[.1,.21,.94]}/><meshStandardMaterial color="#243632" metalness={.6} roughness={.46}/></mesh>)}
  {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <mesh key={'seam'+i} position={[Math.sin(a)*1.45,.305,Math.cos(a)*1.45]} rotation={[-.24,a,0]}><boxGeometry args={[.008,.012,.46]}/><meshStandardMaterial color="#55645d" metalness={.5} roughness={.6}/></mesh>;})}
  <mesh position={[0,.17,1.93]} rotation={[-.25,0,0]}><planeGeometry args={[.24,.24]}/><meshBasicMaterial map={logo} toneMapped={false}/></mesh>
  <mesh position={[0,.39,-.05]} scale={[.9,1.62,.86]}><sphereGeometry args={[1,32,16,0,Math.PI*2,0,Math.PI/2]}/><meshPhysicalMaterial color="#90cbd0" transparent opacity={.16} roughness={.1} metalness={.15} depthWrite={false} side={2}/></mesh>
 </group>;
}





