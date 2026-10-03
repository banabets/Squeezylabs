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
function macaw(colors:{body:string;wing:string;wing2:string;tail:string;chest:string}){
 const g=new Group(),m=(c:string)=>flat(c),head=new Group();
 const add=(geo:SphereGeometry|ConeGeometry|BoxGeometry,mat:Material,x:number,y:number,z:number,parent:Group=g)=>{const o=new Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 add(new SphereGeometry(.13,10,8),m(colors.body),0,.16,0).scale.set(1,1.35,1);
 add(new SphereGeometry(.1,10,8),m(colors.chest),0,.12,.06).scale.set(.9,1.1,.6);
 head.position.set(0,.36,.03);g.add(head);
 add(new SphereGeometry(.085,10,8),m(colors.body),0,0,0,head);
 add(new SphereGeometry(.045,8,6),m('#f4efe4'),0,0,.06,head).scale.set(1.3,1,.6);
 add(new SphereGeometry(.012,6,4),m('#111111'),.04,.01,.07,head);add(new SphereGeometry(.012,6,4),m('#111111'),-.04,.01,.07,head);
 const beak=add(new ConeGeometry(.035,.09,6),m('#2a2420'),0,-.03,.1,head);beak.rotation.x=Math.PI/2+.6;
 for(const s of[-1,1]){const w=add(new BoxGeometry(.05,.22,.14),m(colors.wing),s*.12,.17,-.01);w.rotation.z=s*.12;add(new BoxGeometry(.045,.12,.12),m(colors.wing2),s*.125,.08,-.03).rotation.z=s*.12;}
 const tail=add(new ConeGeometry(.05,.5,4),m(colors.tail),0,-.18,-.08);tail.rotation.x=Math.PI-.25;
 noRaycast(g);return {g,head};
}
const SCARLET={body:'#d2302b',wing:'#f2c14e',wing2:'#2f6fb0',tail:'#d2302b',chest:'#d2302b'};
const BLUEGOLD={body:'#2f6fb0',wing:'#2f6fb0',wing2:'#1f4f8a',tail:'#2f6fb0',chest:'#f2c14e'};
export function Macaws(){
 const {group,perched,flyers}=useMemo(()=>{
  const group=new Group();
  const perched=[{...macaw(SCARLET),x:-1.05,ph:0},{...macaw(BLUEGOLD),x:-.55,ph:2.1}];
  perched.forEach(p=>{p.g.position.set(p.x,3.73,3.8);p.g.rotation.y=.25;group.add(p.g);});
  const flyers=[macaw(SCARLET),macaw(BLUEGOLD)].map((m,i)=>{const wings=[-1,1].map(s=>{const w=new Mesh(new BoxGeometry(.7,.02,.18),flat(i?'#2f6fb0':'#f2c14e'));w.position.set(s*.42,.2,0);w.castShadow=true;m.g.add(w);return w;});m.g.scale.setScalar(1.6);group.add(m.g);return{...m,wings,i};});
  return{group,perched,flyers};
 },[]);
 const time=useRef(0);
 useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)time.current+=Math.min(dt,.05);const t=time.current;
  perched.forEach(p=>{p.head.rotation.y=Math.sin(t*.9+p.ph)*.5*Math.max(0,Math.sin(t*.35+p.ph));p.head.rotation.x=Math.max(0,Math.sin(t*1.7+p.ph))*.25;});
  flyers.forEach(f=>{const a=t*.18+f.i*.5,x=15+Math.cos(a)*9,z=6+Math.sin(a)*7;f.g.position.set(x+f.i*.9,7+Math.sin(t*.8+f.i)*.4,z+f.i*.6);f.g.rotation.set(-.6,Math.atan2(-Math.sin(a),Math.cos(a)*.78),0);f.wings.forEach((w,k)=>{w.rotation.z=(k?-1:1)*Math.sin(t*7+f.i)*.6;});});
 });return <primitive object={group}/>;
}
