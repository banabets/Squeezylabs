import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, FrontSide, MeshStandardMaterial } from 'three';

// Diorama art direction: every surface is a flat-shaded solid color from one palette.
// No photo textures; materials are shared so batchStatic can merge by material.
export const PALETTE = {
  sand: '#f7ecd6', limewash: '#f6efe2', trim: '#fbf7ee', zocalo: '#2f6f9e',
  terracotta: '#d26a43', wood: '#9c7449', woodDark: '#7a5a3a', stone: '#e2d6c0',
  leaf: '#3f8f45', leafLight: '#5aa64a', bark: '#a8794f', barkDark: '#8f6643',
  bougainvillea: '#e2458a', lime: '#a8ed00', ink: '#0c1d1b',
};

// Window glass and lamp glass light up at night; NightLights drives their emissive intensity.
export const nightGlass = new MeshStandardMaterial({ color: '#24413f', roughness: .6, flatShading: true, emissive: '#ffb547', emissiveIntensity: 0 });
export const lampGlass = new MeshStandardMaterial({ color: '#f4e3b0', roughness: .3, flatShading: true, emissive: '#ffcf7a', emissiveIntensity: .5 });

const cache = new Map<string, MeshStandardMaterial>();
export function flat(color: string, { roughness = .9, doubleSide = false, vertexColors = false } = {}) {
  const key = `${color}|${roughness}|${doubleSide}|${vertexColors}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness, flatShading: true, vertexColors, side: doubleSide ? DoubleSide : FrontSide });
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
