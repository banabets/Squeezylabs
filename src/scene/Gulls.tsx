import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {ConeGeometry,DoubleSide,Group,Mesh,MeshBasicMaterial,RingGeometry,Shape,ShapeGeometry,SphereGeometry,BoxGeometry,type Material} from 'three';
import {journey} from '../data/journey';
import {rng} from './Mango';
import {flat} from './flat';

const noRaycast=(g:Group)=>g.traverse(o=>{o.raycast=()=>{};});
const ease=(x:number)=>x*x*(3-2*x);

// Alcatraces (brown pelicans) gliding over the archipelago. Every so often one folds its wings,
// plunges into the sea and climbs back out, the way they fish along the Venezuelan coast.
export function Birds(){
 const {group,birds}=useMemo(()=>{
  const group=new Group(),R=rng(31),body=flat('#8a7f72'),head=flat('#f1ece0'),wingM=flat('#7d7266',{doubleSide:true}),tipM=flat('#3b342e',{doubleSide:true}),bill=flat('#c9a25a');
  const splashM=new MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false,side:DoubleSide});
  const inner=new Shape();inner.moveTo(0,.12);inner.quadraticCurveTo(.4,.22,1,-.02);inner.lineTo(1.1,-.2);inner.lineTo(.5,-.27);inner.lineTo(0,-.2);
  const outer=new Shape();outer.moveTo(0,0);outer.quadraticCurveTo(.4,-.02,.85,-.36);for(let k=0;k<5;k++){outer.lineTo(.78-k*.12,-.46+k*.025);outer.lineTo(.68-k*.11,-.32+k*.014);}outer.lineTo(0,-.2);
  const wing=new ShapeGeometry(inner,6),tip=new ShapeGeometry(outer,6);wing.rotateX(Math.PI/2);tip.rotateX(Math.PI/2);
  const birds=Array.from({length:7},(_,i)=>{
   const g=new Group();g.rotation.order='YXZ';
   const b=new Mesh(new SphereGeometry(1,10,7),body);b.scale.set(.16,.15,.42);g.add(b);
   const neck=new Mesh(new SphereGeometry(1,8,6),head);neck.scale.set(.07,.07,.18);neck.position.set(0,.06,.38);g.add(neck);
   const h=new Mesh(new SphereGeometry(.09,10,7),head);h.position.set(0,.09,.52);g.add(h);
   const beak=new Mesh(new ConeGeometry(.04,.5,6),bill);beak.rotation.x=Math.PI/2;beak.position.set(0,.05,.82);g.add(beak);
   const tail=new Mesh(new ConeGeometry(.12,.26,4),body);tail.rotation.x=-Math.PI/2;tail.scale.z=.3;tail.position.z=-.48;g.add(tail);
   const wings=[-1,1].map(s=>{const shoulder=new Group();shoulder.scale.x=s;const arm=new Mesh(wing,wingM),wrist=new Group();wrist.position.set(1,0,.03);wrist.add(new Mesh(tip,tipM));shoulder.add(arm,wrist);g.add(shoulder);return{shoulder,wrist};});
   g.traverse(o=>{o.castShadow=true;});
   const splash=new Mesh(new RingGeometry(.2,.45,20),splashM.clone());splash.rotation.x=-Math.PI/2;splash.visible=false;group.add(splash);
   noRaycast(g);group.add(g);
   return{g,wings,splash,phase:R()*6.28,rad:16+R()*16,h:9+R()*6,speed:.06+R()*.04,cycle:R()};
  });return{group,birds};
 },[]);
 const time=useRef(0);
 useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)time.current+=Math.min(dt,.05);const t=time.current;
  for(const b of birds){
   const a=b.phase+t*b.speed,x=6+Math.cos(a)*b.rad,z=8+Math.sin(a)*b.rad*.8,yaw=Math.atan2(-Math.sin(a),Math.cos(a)*.8);
   // Dive cycle: ~2% of the time plunging, the rest gliding with bursts of flapping.
   const c=(t*.045+b.cycle)%1,dive=c<.12?c/.12:-1;
   let y=b.h+Math.sin(t*.32+b.phase)*.8,pitch=0,fold=0,flap=0;
   if(dive>=0){
    if(dive<.42){const k=ease(dive/.42);y=b.h*(1-k)-.1*k;pitch=1.25;fold=1;}
    else{const k=ease((dive-.42)/.58);y=-.1+(b.h+.1)*k;pitch=-.45*(1-k);flap=Math.sin(t*9)*.6*(1-k*.5);}
   }else{const burst=Math.pow(Math.max(0,Math.sin(t*.4+b.phase)),5);flap=Math.sin(t*5+b.phase)*.4*burst;}
   b.g.position.set(x,y,z);b.g.rotation.set(pitch,yaw,-.12*(1-fold));
   b.wings.forEach(({shoulder,wrist})=>{shoulder.rotation.z=.06+flap-fold*.2;shoulder.rotation.y=fold*.9;wrist.rotation.z=-.1-fold*.9+flap*.4;});
   // Ring of spray where it hit the water.
   const s=dive>=.4&&dive<.75?(dive-.4)/.35:-1;b.splash.visible=s>=0;
   if(s>=0){b.splash.position.set(x,-.25,z);b.splash.scale.setScalar(1+s*3);(b.splash.material as MeshBasicMaterial).opacity=.8*(1-s);}
  }
 });return <primitive object={group}/>;
}

// Guacamayas: a scarlet and a blue-and-gold macaw perched on the arrival pergola, and a pair flying over the village.
