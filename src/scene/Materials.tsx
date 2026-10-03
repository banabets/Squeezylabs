import { MeshStandardMaterial, Texture, Vector2 } from 'three';
export type Surface='sand'|'plaster'|'wood'|'bark';
export const surfaces:Partial<Record<Surface,{map:Texture;normalMap:Texture;roughnessMap:Texture;normalScale:Vector2}>>={};
// Diorama direction: photo textures are no longer loaded. `surfaces` stays empty so legacy
// `...surfaces.x` spreads fall back to flat colors. Kept as a hook so callers need no change.
export function useMaterials(){}

// Flat coral sand. A per-vertex `wet` attribute darkens and polishes the strip at the waterline.
const sandMats=new Map<string,MeshStandardMaterial>();
export function sandMaterial(color:string){
 let m=sandMats.get(color);if(m)return m;
 m=new MeshStandardMaterial({color,roughness:1,flatShading:true});
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>','#include <common>\nattribute float wet;\nvarying float vWet;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvWet=wet;');
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>','#include <common>\nvarying float vWet;')
   .replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=mix(vec3(1.),vec3(.74,.77,.78),vWet);')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.32,vWet);');
 };
 m.customProgramCacheKey=()=>'coral-sand-v2';
 sandMats.set(color,m);return m;
}
