import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader, Vector2, type MeshStandardMaterial } from 'three';

// Realistic surfaces: CC0 PBR sets from Poly Haven (public/tex, 1k) plus painted leaf textures.
// TextureLoader goes through the default loading manager, so the loader screen counts these files.
const loader = new TextureLoader(), cache = new Map<string, Texture>();
function load(url: string, color: boolean) {
  let t = cache.get(url);
  if (!t) {
    t = loader.load(url);
    t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 8;
    if (color) t.colorSpace = SRGBColorSpace;
    cache.set(url, t);
  }
  return t;
}
export type PbrId = 'white_stucco' | 'cobblestone_square' | 'bark_brown_02' | 'palm_bark' | 'brown_planks_05' | 'coast_sand_01';
/** Applies a Poly Haven set (albedo, OpenGL normal, roughness) to a material. Repeat is set per call via clones. */
export function applyPbr(m: MeshStandardMaterial, id: PbrId, { albedo = true, normalScale = 1, repeat = [1, 1] as number | [number, number] } = {}) {
  const [rx, ry] = typeof repeat === 'number' ? [repeat, repeat] : repeat;
  const get = (map: string, color: boolean) => { const base = load(`/tex/${id}_${map}.webp`, color); if (rx === 1 && ry === 1) return base; const c = base.clone(); c.repeat.set(rx, ry); return c; };
  if (albedo) m.map = get('Diffuse', true);
  m.normalMap = get('nor_gl', false); m.normalScale = new Vector2(normalScale, normalScale);
  m.roughnessMap = get('Rough', false); m.roughness = 1;
  m.needsUpdate = true;
  return m;
}

const canvas = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, alpha = false) => {
  const el = document.createElement('canvas'); el.width = w; el.height = h;
  const c = el.getContext('2d')!; draw(c);
  const t = new CanvasTexture(el); t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
  if (alpha) t.premultiplyAlpha = false;
  return t;
};
let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Leaf textures are near-white so instance and vertex colors still choose the hue;
// they add the midrib, veins, a waxy sheen toward the center and darker margins.
function veins(c: CanvasRenderingContext2D, w: number, h: number, pairs: number, angle: number) {
  const g = c.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#9a9a9a'); g.addColorStop(.3, '#e4e4e4'); g.addColorStop(.5, '#f4f4f4'); g.addColorStop(.7, '#dedede'); g.addColorStop(1, '#8f8f8f');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${rand() > .5 ? 255 : 60},${rand() > .5 ? 255 : 70},60,${rand() * .05})`; c.fillRect(rand() * w, rand() * h, 2, 2); }
  c.strokeStyle = 'rgba(255,255,225,.9)'; c.lineWidth = w * .035; c.beginPath(); c.moveTo(w / 2, h); c.lineTo(w / 2, 0); c.stroke();
  c.strokeStyle = 'rgba(250,250,215,.45)'; c.lineWidth = w * .012;
  for (let i = 1; i < pairs; i++) { const y = h * (1 - i / pairs); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(w / 2, y); c.quadraticCurveTo(w / 2 + s * w * .25, y - h * angle * .5, w / 2 + s * w * .48, y - h * angle); c.stroke(); } }
}
let lance: CanvasTexture | undefined, broad: CanvasTexture | undefined, frond: CanvasTexture | undefined;
/** Mango leaf, mapped on the long lance geometry (u across, v base to tip). */
export const lanceTexture = () => lance ??= canvas(128, 512, c => veins(c, 128, 512, 22, .05));
/** Broad leaf for shrubs, hedges, bougainvillea and mangrove, mapped on leafGeometry's normalized UVs. */
export const broadTexture = () => broad ??= canvas(256, 256, c => veins(c, 256, 256, 8, .16));

/** Coconut frond with alpha: a midrib and some 90 pinnae angled toward the tip, u across and v along. */
export const frondTexture = () => frond ??= canvas(256, 1024, c => {
  c.clearRect(0, 0, 256, 1024);
  const pinnae = 64;
  for (let i = 0; i < pinnae; i++) {
    const v = i / pinnae, y = 1024 * (1 - v) - 6, len = 118 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.05 + .06)), .55);
    for (const s of [-1, 1]) {
      const gx = 128 + s * len, gy = y - 60 - v * 40;
      const tone = 150 + Math.floor(rand() * 70);
      // Each pinna is a slim blade: wide at the rachis, tapering to a point, with a lighter midline.
      const wb = 7 - v * 3, mx = 128 + s * len * .5, my = y - 18;
      c.fillStyle = `rgb(${tone},${tone + 10},${tone - 25})`;
      c.beginPath(); c.moveTo(128, y - wb); c.quadraticCurveTo(mx, my - wb * .8, gx, gy); c.quadraticCurveTo(mx, my + wb * .8, 128, y + wb); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,220,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(128, y); c.quadraticCurveTo(mx, my, gx, gy); c.stroke();
      // A few torn or missing pinnae, as on real coconut palms.
      if (rand() < .06) { c.clearRect(gx - 14, gy - 8, 28, 16); }
    }
  }
  c.strokeStyle = '#e8dcb0'; c.lineWidth = 7; c.beginPath(); c.moveTo(128, 1024); c.lineTo(128, 0); c.stroke();
}, true);
