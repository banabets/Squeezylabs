import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Object3D,Vector3} from 'three';

export function FoliageLod(){
 const scene=useThree(s=>s.scene),trees=useRef<Object3D[]>([]),point=useRef(new Vector3()),clock=useRef(0);
 useEffect(()=>{trees.current=[];scene.traverse(o=>{if(o.userData.foliage)trees.current.push(o);});return()=>{for(const tree of trees.current){const f=tree.userData.foliage;f.leaves.count=f.total;f.fruits.count=f.fruitCount;}};},[scene]);
 useFrame(({camera},dt)=>{clock.current+=dt;if(clock.current<.2)return;clock.current=0;for(const tree of trees.current){tree.getWorldPosition(point.current);const distance=camera.position.distanceTo(point.current),f=tree.userData.foliage;
  const density=distance<30?1:distance<55?.5:.22;f.leaves.count=Math.ceil(f.total*density);f.fruits.count=distance<40?f.fruitCount:0;
 }});return null;
}
