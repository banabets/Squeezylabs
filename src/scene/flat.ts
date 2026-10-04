import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, MeshStandardMaterial } from 'three';
import { applyPbr } from './realism';

// Shared solid-color materials, now smooth-shaded for the realistic pass; they stay shared so batchStatic
// can merge by material. Surfaces that need texture (walls, sand, wood) get PBR maps elsewhere.
export const PALETTE = {
  sand: '#f7ecd6', limewash: '#f6efe2', trim: '#fbf7ee', zocalo: '#2f6f9e',
  terracotta: '#d26a43', wood: '#9c7449', woodDark: '#7a5a3a', stone: '#e2d6c0',
  leaf: '#3f8f45', leafLight: '#5aa64a', bark: '#a8794f', barkDark: '#8f6643',
  bougainvillea: '#e2458a', lime: '#a8ed00', ink: '#0c1d1b',
};

// Window glass and lamp glass light up at night; NightLights drives their emissive intensity.
export const nightGlass = new MeshStandardMaterial({ color: '#24413f', roughness: .25, emissive: '#ffb547', emissiveIntensity: 0 });
export const lampGlass = new MeshStandardMaterial({ color: '#f4e3b0', roughness: .3, emissive: '#ffcf7a', emissiveIntensity: .5 });

const cache = new Map<string, MeshStandardMaterial>();
export function flat(color: string, { roughness = .9, doubleSide = false, vertexColors = false } = {}) {
  const key = `${color}|${roughness}|${doubleSide}|${vertexColors}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness, vertexColors, side: doubleSide ? DoubleSide : FrontSide });
    cache.set(key, m);
  }
  return m;
}

/** Normalizes a geometry for mergeGeometries (non-indexed, position+normal+color) and paints it one color. */
export function painted(g: BufferGeometry, color: string | Color) {
  const out = g.index ? g.toNonIndexed() : g;
  out.deleteAttribute('uv');
  if (!out.attributes.normal) out.computeVertexNormals();
  const c = new Color(color), n = out.attributes.position.count, data = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { data[i * 3] = c.r; data[i * 3 + 1] = c.g; data[i * 3 + 2] = c.b; }
  out.setAttribute('color', new Float32BufferAttribute(data, 3));
  return out;
}

// Limewashed stucco wall: a CC0 stucco set tinted by the wall color, plus soft mottling, a grimy splash
// band at the base and a sun-bleached top. Grime uses world position so merged walls stay continuous.
const limeCache = new Map<string, MeshStandardMaterial>();
export function limewash(color: string) {
  let m = limeCache.get(color);
  if (m) return m;
  m = applyPbr(new MeshStandardMaterial({ color }), 'white_stucco', { normalScale: .4 });
  m.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLime;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvLime=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLime;\nfloat lh(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}\nfloat ln(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(lh(i),lh(i+vec2(1,0)),f.x),mix(lh(i+vec2(0,1)),lh(i+vec2(1,1)),f.x),f.y);}')
      .replace('#include <color_fragment>', `#include <color_fragment>
vec2 q=vec2(vLime.x+vLime.z,vLime.y);
float mottle=ln(q*1.3)*.6+ln(q*4.1)*.4;
diffuseColor.rgb*=(.93+mottle*.1)*1.12;
diffuseColor.rgb*=mix(.74,1.,smoothstep(.25,1.05+ln(q*2.)*.35,vLime.y));
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.97,.9),smoothstep(2.6,4.2,vLime.y)*.12);
// Rain streaks: narrow vertical runs that hang from the cornice and fade toward the ground.
float streak=ln(vec2(q.x*11.,q.y*.32+3.))*.7+ln(vec2(q.x*23.,q.y*.5))*.3;
diffuseColor.rgb*=1.-smoothstep(.55,.85,streak)*smoothstep(.6,2.8,vLime.y)*(.4+.6*ln(q*.6+5.))*.16;
// Peeling: sparse patches where the paint has flaked off to bare grey-beige plaster, with a darker rim.
float pl=ln(q*1.9+11.)*.62+ln(q*6.1)*.38,big=smoothstep(.45,.8,ln(q*.35+2.));
float flake=smoothstep(.785,.795,pl)*big,rim=(smoothstep(.77,.78,pl)-smoothstep(.785,.795,pl))*big;
diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.6+vec3(.3,.28,.25),flake*.6);
diffuseColor.rgb*=1.-rim*.25;`);
  };
  m.customProgramCacheKey = () => 'limewash-v3';
  limeCache.set(color, m);
  return m;
}
