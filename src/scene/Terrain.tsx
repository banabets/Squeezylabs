import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute, InstancedMesh, Object3D, SphereGeometry } from 'three';
import { surfaces } from './Materials';
import { CAYS, cayWobble, mainPoint, type Cay } from '../data/world';

// Ring mesh for one island: flat sand that drops under the water past ring .88.
function islandGeometry(point: (a: number, t: number) => [number, number], segments: number, rings: number) {
  const pos: number[] = [], uv: number[] = [], colors: number[] = [], idx: number[] = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    for (let a = 0; a <= segments; a++) {
      const angle = a / segments * Math.PI * 2, [x, z] = point(angle, t);
      const shore = Math.max(0, (t - .88) / .12);
      const y = .055 + Math.sin(x * 1.6) * Math.sin(z * .8) * .025 * (1 - shore) - Math.pow(shore, 1.5) * 1.05;
      pos.push(x, y, z); uv.push(x * .62, z * .62);
      const c = new Color().setRGB(1 - shore * .4, 1 - shore * .35, 1 - shore * .3);
      colors.push(c.r, c.g, c.b);
      if (r < rings && a < segments) { const i = r * (segments + 1) + a; idx.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1); }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export function NaturalTerrain(){
 const geometry=useMemo(()=>islandGeometry(mainPoint,200,48),[]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial {...surfaces.sand} color="#fff1cd" vertexColors roughness={1}/></mesh>;
}
export function CayTerrain({cay,seed}:{cay:Cay;seed:number}){
 const geometry=useMemo(()=>islandGeometry((a,t)=>{const v=cayWobble(a,seed)*t;return [cay.x+Math.cos(a)*cay.rx*v,cay.z+Math.sin(a)*cay.rz*v];},72,18),[cay,seed]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial {...surfaces.sand} color="#fff3d6" vertexColors roughness={1}/></mesh>;
}
export function Cays(){return <>{CAYS.map((c,i)=><CayTerrain key={i} cay={c} seed={i*1.7}/>)}</>;}
export function BeachStones(){const ref=useRef<InstancedMesh>(null);const g=useMemo(()=>{const g=new SphereGeometry(1,10,7);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=1+Math.sin(x*9+z*4)*Math.cos(y*6)*.12;p.setXYZ(i,x*r,y*r,z*r);}g.computeVertexNormals();return g;},[]);useLayoutEffect(()=>{const o=new Object3D();for(let i=0;i<300;i++){const z=-7+(i%150)*.155,side=i<150?-1:1;const jitter=Math.sin(i*34.12)*.25;o.position.set(side*(1.5+jitter)+Math.sin(z*.3)*.28,.05,z);o.rotation.set(i*.51,i*.31,i*.72);o.scale.set(.08+(i%3)*.04,.05+(i%4)*.02,.11+(i%5)*.02);o.updateMatrix();ref.current!.setMatrixAt(i,o.matrix);ref.current!.setColorAt(i,new Color(['#afa994','#bbb59e','#948f7c','#ccc4ae'][i%4]));}ref.current!.instanceMatrix.needsUpdate=true;},[]);return <instancedMesh ref={ref} args={[g,undefined,300]} castShadow receiveShadow><meshStandardMaterial {...surfaces.plaster} roughness={1}/></instancedMesh>;}

