import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {DoubleSide,Group,Mesh,MeshStandardMaterial,Shape,ShapeGeometry,SphereGeometry,ConeGeometry} from 'three';
import {journey} from '../data/journey';
import {rng} from './Mango';

// Swept wings with tapered primaries; wrists bend independently of the shoulder.
export function Birds(){
 const {group,birds}=useMemo(()=>{
  const group=new Group(),R=rng(31),white=new MeshStandardMaterial({color:'#eeeae0',roughness:.85}),grey=new MeshStandardMaterial({color:'#adb6ba',roughness:.85,side:DoubleSide}),black=new MeshStandardMaterial({color:'#263132',roughness:.9,side:DoubleSide}),bill=new MeshStandardMaterial({color:'#d8b55a',roughness:.65});
  const inner=new Shape();inner.moveTo(0,.1);inner.quadraticCurveTo(.25,.2,.65,-.02);inner.lineTo(.75,-.17);inner.lineTo(.38,-.23);inner.lineTo(0,-.18);
  const outer=new Shape();outer.moveTo(0,0);outer.quadraticCurveTo(.3,-.01,.62,-.34);for(let k=0;k<5;k++){outer.lineTo(.57-k*.09,-.42+k*.022);outer.lineTo(.49-k*.08,-.3+k*.012);}outer.lineTo(0,-.18);
  const wing=new ShapeGeometry(inner,8),tip=new ShapeGeometry(outer,8);wing.rotateX(Math.PI/2);tip.rotateX(Math.PI/2);
  const birds=Array.from({length:8},(_,i)=>{
   const g=new Group(),body=new Mesh(new SphereGeometry(1,12,8),white);body.scale.set(.105,.12,.31);g.add(body);
   const head=new Mesh(new SphereGeometry(.095,12,8),white);head.position.set(0,.085,.26);g.add(head);
   const beak=new Mesh(new ConeGeometry(.025,.15,8),bill);beak.rotation.x=Math.PI/2;beak.position.set(0,.075,.39);g.add(beak);
   const tail=new Mesh(new ConeGeometry(.1,.24,4),white);tail.rotation.x=-Math.PI/2;tail.scale.z=.3;tail.position.z=-.34;g.add(tail);
   const wings=[-1,1].map(s=>{const shoulder=new Group();shoulder.scale.x=s;const arm=new Mesh(wing,grey),wrist=new Group();wrist.position.set(.68,0,.03);wrist.add(new Mesh(tip,black));shoulder.add(arm,wrist);g.add(shoulder);return{shoulder,wrist};});
   g.traverse(o=>{o.raycast=()=>{};});group.add(g);
   return{g,wings,phase:R()*6.28,rad:18+R()*14,h:8+R()*8,speed:.075+R()*.05};
  });return{group,birds};
 },[]);
 const time=useRef(0);
 useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)time.current+=Math.min(dt,.05);const t=time.current;
  for(const b of birds){const a=b.phase+t*b.speed;b.g.position.set(6+Math.cos(a)*b.rad,b.h+Math.sin(t*.32+b.phase)*.8,8+Math.sin(a)*b.rad*.8);b.g.rotation.set(0,Math.atan2(-Math.sin(a),Math.cos(a)*.8),-.14);
   const burst=Math.pow(Math.max(0,Math.sin(t*.48+b.phase)),5),flap=Math.sin(t*6+b.phase)*.45*burst;
   b.wings.forEach(({shoulder,wrist})=>{shoulder.rotation.z=.08+flap;wrist.rotation.z=-.1+Math.sin(t*6+b.phase-.7)*.25*burst;});
  }
 });return <primitive object={group}/>;
}
