import assert from 'node:assert/strict';
import {Box3,BoxGeometry,Group,Mesh,MeshStandardMaterial,Vector3} from 'three';
import {batchStatic,instanceRepeated} from '../src/scene/batchStatic.ts';
const root=new Group();root.position.set(9,2,-3);root.rotation.y=.7;
const nested=new Group();nested.position.set(2,1,0);nested.rotation.z=.3;root.add(nested);
const material=new MeshStandardMaterial();
for(let i=0;i<5;i++){const m=new Mesh(new BoxGeometry(1,2,3),material);m.position.x=i*2;m.scale.y=1+i*.1;nested.add(m);}
const clickable=new Mesh(new BoxGeometry(),material);clickable.userData.key='project';root.add(clickable);
const before=new Box3().setFromObject(root);batchStatic(root);const after=new Box3().setFromObject(root);
assert.ok(before.min.distanceTo(after.min)<1e-5);assert.ok(before.max.distanceTo(after.max)<1e-5);
assert.equal(clickable.parent,root);assert.equal(nested.children.length,0);
assert.equal(root.children.filter(o=>o instanceof Mesh).length,2);
assert.ok(after.getSize(new Vector3()).length()>0);
console.log('Batching: transforms, bounds, draw reduction and interactive mesh preservation passed.');
const shelf=new Group(),geometry=new BoxGeometry(),mats=[material,material,material,material,material,material];
for(let i=0;i<52;i++){const pack=new Mesh(geometry,mats);pack.position.x=i*.2;pack.userData.key='harina';shelf.add(pack);}
const moving=new Mesh(geometry,material);moving.userData.dynamic=true;shelf.add(moving);
const shelfBefore=new Box3().setFromObject(shelf);instanceRepeated(shelf);batchStatic(shelf);const shelfAfter=new Box3().setFromObject(shelf);
assert.ok(shelfBefore.min.distanceTo(shelfAfter.min)<1e-5);assert.ok(shelfBefore.max.distanceTo(shelfAfter.max)<1e-5);
const packs=shelf.children.find(o=>o.userData.key==='harina');assert.equal(packs.count,52);assert.equal(shelf.children.length,2);assert.equal(moving.parent,shelf);
console.log('Shelf: 52 clickable packages instanced; animated object retained; bounds unchanged.');
