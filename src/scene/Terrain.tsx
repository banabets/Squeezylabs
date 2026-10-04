import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute, InstancedMesh, Object3D, SphereGeometry } from 'three';
import { sandMaterial, surfaces } from './Materials';
import { CAYS, cayWobble, mainPoint, type Cay } from '../data/world';

// Ring mesh for one island: sand that drops under the water past ring .88. Cays get a gentle dome so
// they read as sandbanks instead of flat plates.
function islandGeometry(point: (a: number, t: number) => [number, number], segments: number, rings: number, dome = 0) {
  const pos: number[] = [], uv: number[] = [], wet: number[] = [], idx: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    for (let a = 0; a <= segments; a++) {
      const angle = a / segments * Math.PI * 2, [x, z] = point(angle, t);
      const shore = Math.max(0, (t - .88) / .12);
      const y = .055 + Math.sin(x * 1.6) * Math.sin(z * .8) * .025 * (1 - shore) - Math.pow(shore, 1.5) * 1.05 + dome * (1 - t * t);
      pos.push(x, y, z); uv.push(x * .62, z * .62);
      // Damp strip just above the waterline (y crosses 0 near shore = .14).
      const s = Math.min(1, Math.max(0, (shore + .02) / .14)); wet.push(s * s * (3 - 2 * s));
      if (r < rings && a < segments) { const i = r * (segments + 1) + a; idx.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1); }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setAttribute('wet', new Float32BufferAttribute(wet, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export function NaturalTerrain(){
 const geometry=useMemo(()=>islandGeometry(mainPoint,200,48),[]);
 return <mesh geometry={geometry} material={sandMaterial('#f8ead0')} receiveShadow/>;
}
export function CayTerrain({cay,seed}:{cay:Cay;seed:number}){
 const geometry=useMemo(()=>islandGeometry((a,t)=>{const v=cayWobble(a,seed)*t;return [cay.x+Math.cos(a)*cay.rx*v,cay.z+Math.sin(a)*cay.rz*v];},72,18,.32),[cay,seed]);
 return <mesh geometry={geometry} material={sandMaterial('#dcc7a2')} receiveShadow/>;
}
export function Cays(){return <>{CAYS.map((c,i)=><CayTerrain key={i} cay={c} seed={i*1.7}/>)}</>;}
export function BeachStones(){const ref=useRef<InstancedMesh>(null);const g=useMemo(()=>{const g=new SphereGeometry(1,10,7);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+Math.sin(x*9+z*4)*Math.cos(y*6)*.12;p.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();return g;},[]);useLayoutEffect(()=>{const o=new Object3D();for(let i=0;i<300;i++){const z=-7+(i%150)*.155,side=i<150?-1:1;const jitter=Math.sin(i*34.12)*.25;o.position.set(side*(1.5+jitter)+Math.sin(z*.3)*.28,.05,z);o.rotation.set(i*.51,i*.31,i*.72);o.scale.set(.08+(i%3)*.04,.05+(i%4)*.02,.11+(i%5)*.02);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);ref.current!.setColorAt(i,new Color(['#e2d6c0','#d8cbb2','#ece3d0','#cfc1a6'][i%4]));}ref.current!.instanceMatrix.needsUpdate=true;},[]);return <instancedMesh ref={ref} args={[g,undefined,300]} castShadow receiveShadow><meshStandardMaterial roughness={.9}/></instancedMesh>;}

