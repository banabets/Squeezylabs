import { Color, Vector3, type DirectionalLight, type HemisphereLight, type Scene, Fog } from 'three';

// One day across the scroll: morning on arrival, noon in the studio, afternoon at the bodega, sunset, then night on the horizon.
type Key = { p: number; sun: [number, number, number]; color: string; intensity: number; hemiSky: string; hemiGround: string; hemi: number; top: string; horizon: string };
const KEYS: Key[] = [
  { p: 0, sun: [24, 16, 18], color: '#ffe2bd', intensity: 3.1, hemiSky: '#cfe3f2', hemiGround: '#e2d8c2', hemi: .55, top: '#5f9fd2', horizon: '#cfe6ea' },
  { p: .45, sun: [-4, 34, 12], color: '#fff6e6', intensity: 3.6, hemiSky: '#bcdcf2', hemiGround: '#e0d6c0', hemi: .52, top: '#3f8fd0', horizon: '#bfe0ea' },
  { p: .82, sun: [-24, 15, 12], color: '#ffd6a0', intensity: 3.3, hemiSky: '#d9d6c6', hemiGround: '#d6c6a8', hemi: .5, top: '#5a92c8', horizon: '#efd6b8' },
  { p: .93, sun: [-30, 6.5, 10], color: '#ff9a55', intensity: 2.6, hemiSky: '#e8b59a', hemiGround: '#8a7060', hemi: .4, top: '#5d78b2', horizon: '#f2a978' },
  // Moonlight: the sun light becomes a cool, high key light so the island still reads at night.
  { p: 1, sun: [-12, 24, -14], color: '#a9bcff', intensity: .4, hemiSky: '#3f5288', hemiGround: '#1d2335', hemi: .24, top: '#081226', horizon: '#25365e' },
];

// Raw (display-space) colors for hand-written shaders that skip color management.
const raw = (hex: string) => { const n = parseInt(hex.slice(1), 16); return new Color().setRGB((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255); };
const rawKeys = KEYS.map(k => ({ color: raw(k.color), top: raw(k.top), horizon: raw(k.horizon) }));
const linKeys = KEYS.map(k => ({ color: new Color(k.color), hemiSky: new Color(k.hemiSky), hemiGround: new Color(k.hemiGround), horizon: new Color(k.horizon) }));

// Shared uniform values: shaders keep references to these objects and see every update.
export const sky = { sunDir: new Vector3(24, 16, 18).normalize(), sunColor: raw(KEYS[0].color), top: raw(KEYS[0].top), horizon: raw(KEYS[0].horizon), warmth: { value: 0 }, night: { value: 0 } };
const v = new Vector3(), w = new Vector3();

export function applyDaylight(p: number, sun: DirectionalLight, hemi: HemisphereLight, scene: Scene) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i], b = KEYS[i + 1], f0 = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))), f = f0 * f0 * (3 - 2 * f0);
  v.fromArray(a.sun).normalize(); w.fromArray(b.sun).normalize();
  sky.sunDir.copy(v).lerp(w, f).normalize();
  sky.sunColor.copy(rawKeys[i].color).lerp(rawKeys[i + 1].color, f);
  sky.top.copy(rawKeys[i].top).lerp(rawKeys[i + 1].top, f);
  sky.horizon.copy(rawKeys[i].horizon).lerp(rawKeys[i + 1].horizon, f);
  sky.night.value = Math.min(1, Math.max(0, (p - .93) / .07));
  sky.warmth.value = Math.min(1, Math.max(0, (p - .7) / .23)) * (1 - sky.night.value);
  sun.position.copy(sky.sunDir).multiplyScalar(45);
  sun.color.copy(linKeys[i].color).lerp(linKeys[i + 1].color, f);
  sun.intensity = a.intensity + (b.intensity - a.intensity) * f;
  hemi.color.copy(linKeys[i].hemiSky).lerp(linKeys[i + 1].hemiSky, f);
  hemi.groundColor.copy(linKeys[i].hemiGround).lerp(linKeys[i + 1].hemiGround, f);
  hemi.intensity = a.hemi + (b.hemi - a.hemi) * f;
  if (scene.background instanceof Color) scene.background.copy(linKeys[i].horizon).lerp(linKeys[i + 1].horizon, f);
  if (scene.fog instanceof Fog) scene.fog.color.copy(linKeys[i].horizon).lerp(linKeys[i + 1].horizon, f);
}

