import { MeshStandardMaterial, Texture, Vector2 } from 'three';
import { applyPbr } from './realism';
export type Surface='sand'|'plaster'|'wood'|'bark';
export const surfaces:Partial<Record<Surface,{map:Texture;normalMap:Texture;roughnessMap:Texture;normalScale:Vector2}>>={};
// Legacy hook: textures now load per material through realism.ts. `surfaces` stays empty so old
// `...surfaces.x` spreads fall back to plain colors. Kept so callers need no change.
export function useMaterials(){}

// White coral sand with a real CC0 sand set: the photo only modulates grain (its brown hue is dropped,
// so the beach stays white), its normal and roughness give the surface relief. A per-vertex `wet`
// attribute darkens and polishes the strip at the waterline.
const sandMats=new Map<string,MeshStandardMaterial>();
export function sandMaterial(color:string){
 let m=sandMats.get(color);if(m)return m;
 m=applyPbr(new MeshStandardMaterial({color}),'coast_sand_01',{normalScale:1.1});
 // Sand is very rough: a full-strength sky reflection at low sun angles turns it lilac.
 m.envMapIntensity=.45;
 m.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader
   .replace('#include <common>',`#include <common>
attribute float wet;
varying float vWet;varying vec2 vSandW;`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
vWet=wet;vSandW=(modelMatrix*vec4(position,1.)).xz;`);
  shader.fragmentShader=shader.fragmentShader
   .replace('#include <common>',`#include <common>
varying float vWet;varying vec2 vSandW;
float sh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(sh(i),sh(i+vec2(1,0)),f.x),mix(sh(i+vec2(0,1)),sh(i+vec2(1,1)),f.x),f.y);}`)
   .replace('#include <map_fragment>',`vec3 sandTex=texture2D(map,vMapUv).rgb;float grain=dot(sandTex,vec3(.3,.59,.11));
// Large soft patches break the tiling of the 1.6 m texture ('patch' is a reserved word in GLSL ES 3).
float drift=sn(vSandW*.11)*.6+sn(vSandW*.37)*.4;
diffuseColor.rgb*=mix(1.,grain/.42,.26)*(.97+drift*.06);
diffuseColor.rgb*=mix(vec3(1.),vec3(.74,.77,.78),vWet);`)
   .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
roughnessFactor=mix(roughnessFactor,.32,vWet);`)
   // Shade on real sand is filled by warm bounce light, not by the blue sky alone: warm and desaturate the
   // indirect term so shadows read sandy-grey instead of lilac.
   .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
{vec3 ind=reflectedLight.indirectDiffuse;float l=dot(ind,vec3(.299,.587,.114));reflectedLight.indirectDiffuse=mix(vec3(l),ind,.35)*vec3(1.14,1.,.8);
reflectedLight.indirectSpecular*=.4;}`);
 };
 m.customProgramCacheKey=()=>'coral-sand-v5';
 sandMats.set(color,m);return m;
}
