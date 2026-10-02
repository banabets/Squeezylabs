import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Color,Float32BufferAttribute,Group,InstancedMesh,SphereGeometry,MeshStandardMaterial,Object3D} from 'three';
import {surfaces} from './Materials';
import {journey} from '../data/journey';
const noise=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function NaturalPalm({position,scale=1,seed=0,yaw=0,lean=0}:{position:[number,number,number];scale?:number;seed?:number;yaw?:number;lean?:number}){
 const crown=useRef<Group>(null),time=useRef(0);
 const nuts=useMemo(()=>{const m=new InstancedMesh(new SphereGeometry(1,12,8),new MeshStandardMaterial({color:'#807249',roughness:.94}),6),o=new Object3D();for(let i=0;i<6;i++){o.position.set(Math.cos(i*2.4)*.22,-.18-(i%3)*.08,Math.sin(i*2.4)*.22);o.scale.set(.13,.18,.13);o.updateMatrix();m.setMatrixAt(i,o.matrix);}m.castShadow=true;return m;},[]);
 const trunk=useMemo(()=>{
  const p:number[]=[],uv:number[]=[],idx:number[]=[];const rows=42,sides=14;
  for(let j=0;j<=rows;j++){const t=j/rows,y=t*5.6,r=.22-t*.085+.09*Math.exp(-t*20)+Math.sin(t*140)*.006,cx=t*t*.5;
   for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2;p.push(cx+Math.cos(a)*r,y,Math.sin(a)*r);uv.push(k/sides*1.4,t*4.5);if(j<rows&&k<sides){const n=j*(sides+1)+k;idx.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}}
  }const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
 },[]);
 const leaves=useMemo(()=>{
  const p:number[]=[],uv:number[]=[],colors:number[]=[],idx:number[]=[];
  for(let f=0;f<14;f++){
   const a=f*2.399+seed,L=3.1+noise(f+seed)*1.6,lift=.65+noise(f+seed+81)*1.3,droop=1.3+noise(f+seed+3)*1.2;
   const col=new Color(f>11?'#79633d':['#325327','#46672c','#587b36','#3d5a25'][f%4]);
   for(let s=1;s<27;s++){const t=s/27,r=t*L,h=Math.sin(t*Math.PI*.9)*lift-t*t*t*droop,w=Math.pow(Math.sin(t*Math.PI),.7)*(.52+noise(f+4)*.2);
    for(const side of [-1,1]){const base=p.length/3,sweep=.32+noise(s+f)*.24;
     for(let k=0;k<=5;k++){const q=k/5,thin=Math.sin(q*Math.PI)*(.032+noise(s+seed)*.02);for(const edge of [-1,1]){const xx=Math.sin(a)*w*side*q+Math.cos(a)*(sweep*q+thin*edge),zz=-Math.cos(a)*w*side*q+Math.sin(a)*(sweep*q+thin*edge);p.push(Math.cos(a)*r+xx,h-.38*q*q+Math.sin(q*Math.PI)*.06,Math.sin(a)*r+zz);uv.push((edge+1)/2,q);const fade=.82+noise(s*3+f)*.3;colors.push(col.r*fade,col.g*fade,col.b*fade);}if(k<5){const n=base+k*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}}
    }
   }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setIndex(idx);g.computeVertexNormals();return g;
 },[seed]);
 useFrame((_,dt)=>{if(journey.paused||journey.reduced)return;time.current+=Math.min(dt,.05);if(crown.current){crown.current.rotation.z=Math.sin(time.current*.6+seed)*.018;crown.current.rotation.y=Math.sin(time.current*.3+seed)*.02;}});
 return <group position={position} rotation={[0,yaw,-lean]} scale={scale}><mesh geometry={trunk} castShadow receiveShadow><meshStandardMaterial {...surfaces.bark} color="#c0b9a0" roughness={.94}/></mesh><group ref={crown} position={[.5,5.6,0]}><mesh geometry={leaves} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.68} side={2}/></mesh><primitive object={nuts}/></group></group>;
}


