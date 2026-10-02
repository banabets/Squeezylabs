import {Group,Mesh,InstancedMesh,Matrix4,Material,BufferGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Only call on immutable scenery. Interactive and instanced meshes stay separate. */
export function batchStatic(root:Group){
 root.updateMatrixWorld(true);
 const inverse=new Matrix4().copy(root.matrixWorld).invert();
 const buckets=new Map<Material,Mesh[]>();
 root.traverse(o=>{if(!(o instanceof Mesh)||o instanceof InstancedMesh||Array.isArray(o.material)||o.material.transparent||o.userData.key||o.userData.dynamic||o.customDepthMaterial)return;let parent=o.parent;while(parent&&parent!==root){if(parent.userData.key||parent.userData.dynamic)return;parent=parent.parent;}const a=buckets.get(o.material)||[];a.push(o);buckets.set(o.material,a);});
 for(const [material,meshes] of buckets){if(meshes.length<2)continue;
  const parts:BufferGeometry[]=meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return g.applyMatrix4(new Matrix4().multiplyMatrices(inverse,m.matrixWorld));});
  const geometry=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(!geometry)continue;
  const batch=new Mesh(geometry,material);batch.castShadow=meshes.some(m=>m.castShadow);batch.receiveShadow=meshes.some(m=>m.receiveShadow);batch.raycast=()=>{};root.add(batch);meshes.forEach(m=>m.removeFromParent());
 }return root;
}

/** Repeated shelf packages retain their product key and native instance picking. */
export function instanceRepeated(root:Group){
 root.updateMatrixWorld(true);const inverse=new Matrix4().copy(root.matrixWorld).invert();const buckets=new Map<string,Mesh[]>();
 root.traverse(o=>{if(!(o instanceof Mesh)||o instanceof InstancedMesh||o.userData.dynamic||o.customDepthMaterial)return;
  let parent=o.parent;while(parent&&parent!==root){if(parent.userData.dynamic)return;parent=parent.parent;}
  const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.some(m=>m.transparent))return;
  const key=[o.geometry.uuid,...mats.map(m=>m.uuid),o.userData.key||'',o.castShadow,o.receiveShadow].join('|');const a=buckets.get(key)||[];a.push(o);buckets.set(key,a);
 });
 for(const meshes of buckets.values()){if(meshes.length<2)continue;const first=meshes[0],batch=new InstancedMesh(first.geometry,first.material,meshes.length);batch.userData={...first.userData};batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;if(!batch.userData.key)batch.raycast=()=>{};
  meshes.forEach((m,i)=>batch.setMatrixAt(i,new Matrix4().multiplyMatrices(inverse,m.matrixWorld)));batch.computeBoundingSphere();root.add(batch);meshes.forEach(m=>m.removeFromParent());
 }return root;
}
