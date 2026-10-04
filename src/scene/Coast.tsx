import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Group, IcosahedronGeometry, MeshStandardMaterial, Vector3, Shape, ShapeGeometry, SRGBColorSpace } from 'three';
import { Box } from './Primitives';
import { RoundedBox } from '@react-three/drei';
import { journey } from '../data/journey';
import { NaturalTerrain, Cays } from './Terrain';
import { BOATS } from '../data/world';
import { Mountains } from './Mountains';
export function Island(){
 const shape=useMemo(()=>{const s=new Shape();s.moveTo(-20,13);s.bezierCurveTo(-24,1,-15,-8,-8,-8);s.bezierCurveTo(-2,-7,1,-11,8,-8);s.bezierCurveTo(21,-7,24,7,20,18);s.bezierCurveTo(15,32,-22,30,-20,13);return s;},[]);
 return <>
 <NaturalTerrain/><Cays/>
 {/* Shore rocks and the pier are scanned CC0 models (Props.tsx). */}
 <Mountains/>
 </>;
}
export function Peneros(){return <>{BOATS.map((b,i)=><Penero key={i} x={b.x} z={b.z} ang={b.ang} hull={b.hull} trim={b.trim} name={b.name} paint={b.paint} phase={i*1.7}/>)}</>;}
// Hand-painted boat name, as on the peñeros of Margarita and Choroní.
function nameTexture(name:string,paint:string){
 const c=document.createElement('canvas');c.width=512;c.height=128;const k=c.getContext('2d')!;
 const font=(px:number)=>{k.font=`${px}px "Caveat Brush", "Segoe Script", cursive`;};
 // Long names shrink to fit the painted panel.
 const fit=()=>{font(76);const w=k.measureText(name).width;if(w>480)font(Math.floor(76*480/w));};fit();k.textAlign='center';k.textBaseline='middle';
 k.fillStyle='rgba(0,0,0,.25)';k.fillText(name,259,70);k.fillStyle=paint;k.fillText(name,256,66);
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.anisotropy=4;
 // The web font may arrive after the first draw; repaint once it is ready.
 document.fonts?.load('76px "Caveat Brush"').then(()=>{k.clearRect(0,0,512,128);fit();k.fillStyle='rgba(0,0,0,.25)';k.fillText(name,259,70);k.fillStyle=paint;k.fillText(name,256,66);t.needsUpdate=true;}).catch(()=>{});
 return t;
}
// Peñero: the open wooden fishing boat of the Venezuelan coast. Long and narrow, with a raised,
// pointed bow, a flat transom carrying an outboard, a dark antifouling bottom, a bright hull and a
// contrasting band under the gunwale, and the boat's name painted by hand on the bow.
const L=5.2,SEC=36,RING=9;
const beam=(u:number)=>.78*Math.pow(Math.sin(Math.min(1,(1-u)*1.08)*Math.PI/2+(u<.35?0:0)),.55)*(u<.04?.92+u*2:1)*(1-Math.pow(u,3)*.92);
const sheer=(u:number)=>.52+Math.pow(u,2.6)*.62;
const keel=(u:number)=>-.3+Math.pow(Math.max(0,u-.55)/.45,2)*.55;
function hullGeometry(inner=false){
 const pos:number[]=[],idx:number[]=[],col:number[]=[];
 for(let i=0;i<=SEC;i++){const u=i/SEC,b=beam(u),top=sheer(u),k=keel(u),z=L/2-u*L;
  for(let j=0;j<=RING;j++){const v=j/RING*2-1,a=Math.abs(v);
   // Cross-section: steep topsides above a soft chine, then a shallow V to the keel.
   const y=a>.55?k+(top-k)*(.35+.65*((a-.55)/.45)):k+(top-k)*.35*Math.pow(a/.55,1.6);
   const x=Math.sign(v)*b*(a>.55?.86+.14*Math.sin((a-.55)/.45*Math.PI/2):Math.pow(a/.55,.9)*.86);
   pos.push(x,y,z);col.push(y,top,0);}}
 for(let i=0;i<SEC;i++)for(let j=0;j<RING;j++){const a=i*(RING+1)+j,c=a+RING+1;if(inner)idx.push(a,a+1,c,c,a+1,c+1);else idx.push(a,c,a+1,c,c+1,a+1);}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(pos,3));g.setAttribute('h',new Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
 if(inner){
  // The inside skin is the outside pushed in along its normals by the plank thickness, so the two
  // never cross (a scaled copy pokes through where the section turns at the chine).
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.04,p.getY(i)+n.getY(i)*.04,p.getZ(i)+n.getZ(i)*.04);
  g.computeVertexNormals();
 }
 return g;
}
function transomShape(){const s=new Shape(),u=0,b=beam(u),t=sheer(u),k=keel(u);s.moveTo(-b,t);s.lineTo(b,t);s.lineTo(b*.86,k+(t-k)*.35);s.lineTo(0,k);s.lineTo(-b*.86,k+(t-k)*.35);s.closePath();return s;}
const hullCache=new Map<string,MeshStandardMaterial>();
// Paint by height: antifouling below the waterline, hull color, a band under the gunwale, a pale rail.
function hullPaint(hull:string,band:string,name:CanvasTexture|null){
 const key=hull+band+(name?name.uuid:'');let m=hullCache.get(key);if(m)return m;
 m=new MeshStandardMaterial({color:'#ffffff',roughness:.62});
 const uniforms={cHull:{value:new Color(hull)},cBand:{value:new Color(band)},uName:{value:name},uHasName:{value:name?1:0}};
 m.onBeforeCompile=s=>{Object.assign(s.uniforms,uniforms);
  s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
attribute vec3 h;varying vec3 vH;varying vec3 vP;`).replace('#include <begin_vertex>',`#include <begin_vertex>
vH=h;vP=position;`);
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
uniform vec3 cHull,cBand;uniform sampler2D uName;uniform float uHasName;varying vec3 vH;varying vec3 vP;`)
   .replace('#include <color_fragment>',`#include <color_fragment>
    float y=vH.x,top=vH.y;vec3 c=cHull;
    c=mix(c,cBand,step(top-.16,y)*step(y,top-.05));
    c=mix(c,vec3(.93,.9,.84),step(top-.035,y));
    c=mix(vec3(.42,.08,.07),c,smoothstep(.02,.05,y));
    // Weathering: scuffs and faint plank seams.
    float n=fract(sin(dot(floor(vP.zy*vec2(9.,30.)),vec2(12.9,78.2)))*43758.5);
    c*=.94+.06*n;c*=1.-.05*step(.92,fract(y*11.));
    // Hand-painted name on both sides of the bow, read from stern to bow on each side.
    vec2 nuv=vec2((-sign(vP.x)*(vP.z-(NAMEZ)))/2.0+.5,(y-(top-.28))/.46+.5);
    if(uHasName>.5&&nuv.x>0.&&nuv.x<1.&&nuv.y>0.&&nuv.y<1.){vec4 tx=texture2D(uName,nuv);c=mix(c,tx.rgb,tx.a);}
    diffuseColor.rgb=c;`.replace('NAMEZ',(L/2-.2*L).toFixed(3)));};
 m.customProgramCacheKey=()=>'penero-v3';hullCache.set(key,m);return m;
}
export function Penero({x,z,ang,hull:hullColor,trim,phase,name,paint='#fbf7ee'}:{x:number;z:number;ang:number;hull:string;trim:string;phase:number;name?:string;paint?:string}){
 const label=useMemo(()=>name?nameTexture(name,paint):null,[name,paint]);
 const ref=useRef<Group>(null),time=useRef(phase);
 const g=useMemo(()=>({outer:hullGeometry(),inner:hullGeometry(true),transom:(()=>{const t=new ShapeGeometry(transomShape()),p=t.attributes.position,h:number[]=[];for(let i=0;i<p.count;i++)h.push(p.getY(i),sheer(0),0);t.setAttribute('h',new Float32BufferAttribute(h,3));return t;})()}),[]);
 useFrame((_,dt)=>{if(journey.paused||journey.reduced)return;time.current+=dt;if(ref.current){ref.current.position.y=Math.sin(time.current*.9)*.04-.02;ref.current.rotation.z=Math.sin(time.current*.65)*.03;ref.current.rotation.x=Math.sin(time.current*.5+1)*.015;}});
 const wood='#b48a5a';
 return <group position={[x,0,z]} rotation={[0,ang,0]}><group ref={ref}>
 <mesh geometry={g.outer} material={hullPaint(hullColor,trim,label)} castShadow receiveShadow/>
 <mesh geometry={g.inner}><meshStandardMaterial color="#d9cdb4" roughness={.85}/></mesh>
 <mesh geometry={g.transom} position={[0,0,L/2]} material={hullPaint(hullColor,trim,label)} castShadow/>
 {/* Floorboards and three thwarts. */}
 <Box position={[0,-.16,.6]} size={[.34,.03,2.4]} color={wood}/>
 {[1.6,.2,-1.2].map(zz=><Box key={zz} position={[0,.32,zz]} size={[beam((L/2-zz)/L)*1.55,.05,.26]} color="#e8dcc0"/>)}
 {/* Outboard motor on the transom: cowling, leg and skeg. */}
 <group position={[0,.42,L/2+.12]} rotation={[-.12,0,0]}>
  <RoundedBox args={[.32,.38,.48]} radius={.1} smoothness={4} position={[0,.22,.08]} castShadow><meshStandardMaterial color="#1d2a3a" roughness={.3} metalness={.2}/></RoundedBox>
  <RoundedBox args={[.3,.07,.44]} radius={.03} smoothness={3} position={[0,.4,.08]}><meshStandardMaterial color="#e9edf0" roughness={.3}/></RoundedBox>
  <mesh position={[0,-.22,.02]}><boxGeometry args={[.08,.6,.16]}/><meshStandardMaterial color="#1d2a3a" roughness={.4}/></mesh>
  <mesh position={[0,-.55,.0]}><boxGeometry args={[.06,.08,.34]}/><meshStandardMaterial color="#1d2a3a" roughness={.4}/></mesh>
  <mesh position={[0,.1,-.3]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.018,.018,.5,8]}/><meshStandardMaterial color="#222" roughness={.6}/></mesh>
 </group>
 {/* Red fuel tank, a pile of nets and a couple of floats. */}
 <mesh position={[.3,-.02,1.95]} castShadow><boxGeometry args={[.32,.24,.46]}/><meshStandardMaterial color="#c8261d" roughness={.5}/></mesh>
 <mesh position={[-.15,.02,.9]} scale={[.36,.14,.5]} castShadow><sphereGeometry args={[1,14,10]}/><meshStandardMaterial color="#3d5b4a" roughness={1}/></mesh>
 {[[.18,.95],[-.12,.45]].map(([xx,zz])=><mesh key={zz} position={[xx,.08,zz]} castShadow><sphereGeometry args={[.08,12,10]}/><meshStandardMaterial color="#f08a1c" roughness={.5}/></mesh>)}
 </group></group>;
}

// Smooth, half-sunk boulders at the west waterline: they frame the sunset without filling the shot.
// Noise-displaced icospheres, darker and glossier where the sea keeps them wet.
const BOULDERS:[number,number,number,number][]=[[-19.6,3.1,.75,.4],[-20.4,2.4,.45,1.7],[-19.1,2.2,.3,2.6],[-21.2,11.8,.9,.9],[-20.3,12.6,.5,2.2],[-22.1,11,.38,3.1]];
export function ShoreBoulders(){
 const {geo,mat}=useMemo(()=>{
  const geo=new IcosahedronGeometry(1,4),p=geo.attributes.position,v=new Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=Math.sin(v.x*2.3+v.y*1.1)*.12+Math.sin(v.z*3.7-v.x*1.9)*.07+Math.sin(v.y*7.1+v.z*5.3)*.03;v.multiplyScalar(1+n);v.y*=.62;p.setXYZ(i,v.x,v.y,v.z);}
  geo.computeVertexNormals();
  const mat=new MeshStandardMaterial({color:'#6e655c',roughness:.85});
  mat.onBeforeCompile=s=>{
   s.vertexShader=s.vertexShader.replace('#include <common>',`#include <common>
varying vec3 vWp;`).replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
vWp=(modelMatrix*vec4(transformed,1.)).xyz;`);
   s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vWp;float bh(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}`)
    .replace('#include <color_fragment>',`#include <color_fragment>
float wetB=1.-smoothstep(.02,.22,vWp.y);float sp=bh(floor(vWp*28.));
diffuseColor.rgb*=(.85+.3*sp)*mix(1.,.55,wetB);`)
    .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
roughnessFactor=mix(roughnessFactor,.28,1.-smoothstep(.02,.22,vWp.y));`);
  };
  mat.customProgramCacheKey=()=>'boulder-v1';
  return {geo,mat};
 },[]);
 return <>{BOULDERS.map(([x,z,s,r],i)=><mesh key={i} geometry={geo} material={mat} position={[x,-.12*s,z]} rotation={[0,r,0]} scale={[s*1.2,s,s]} castShadow receiveShadow/>)}</>;
}
