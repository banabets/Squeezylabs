import { useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, Vector3, Quaternion } from 'three';
import { type Surface } from './Materials';
import { flat } from './flat';
type V = [number, number, number];
const geometries=new Map<string,BoxGeometry>();
function geometry(size:V){const key=size.join();if(!geometries.has(key)){const g=new BoxGeometry(...size),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))*.5,(Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))*.5);geometries.set(key,g);}return geometries.get(key)!;}
const cylinder = new CylinderGeometry(1,1,1,10);
export function material(color:string,surface?:Surface){void surface;return flat(color);}
export function Box({position=[0,0,0],size=[1,1,1],color='#eadfc6',rotation=[0,0,0],surface}:{position?:V;size?:V;color?:string;rotation?:V;surface?:Surface}){return <mesh geometry={geometry(size)} material={material(color,surface)} position={position} rotation={rotation} castShadow receiveShadow/>;}
export function Beam({a,b,r=.06,color='#755443'}:{a:V;b:V;r?:number;color?:string}) {
 const {mid, q, length}=useMemo(()=>{const p=new Vector3(...a),end=new Vector3(...b), dir=end.clone().sub(p); return {mid:p.add(end).multiplyScalar(.5),q:new Quaternion().setFromUnitVectors(new Vector3(0,1,0),dir.clone().normalize()),length:dir.length()};},[a.join(),b.join()]);
 return <mesh geometry={cylinder} material={material(color,'wood')} position={mid} quaternion={q} scale={[r,length,r]} castShadow receiveShadow/>;
}
