import { Color, Vector3, type DirectionalLight, type HemisphereLight, type Scene, Fog } from 'three';

// Afternoon into night across the scroll: golden light at the bodega (the sun from the west lights its
// facade), a lower warmer sun through the studio, sunset over the archipelago, then night on the horizon.
type Key = { p: number; sun: [number, number, number]; color: string; intensity: number; hemiSky: string; hemiGround: string; hemi: number; top: string; horizon: string };
const KEYS: Key[] = [
  { p: 0, sun: [-24, 15, 12], color: '#ffdcae', intensity: 4.3, hemiSky: '#d6dce0', hemiGround: '#d6c6a8', hemi: .34, top: '#3a7ccc', horizon: '#ead9c4' },
  { p: .5, sun: [-20, 20, 16], color: '#ffdcb0', intensity: 4.2, hemiSky: '#e2ddd2', hemiGround: '#e0cfae', hemi: .32, top: '#3f78c4', horizon: '#eed6bc' },
  { p: .8, sun: [-26, 13, 12], color: '#ffc48c', intensity: 3.8, hemiSky: '#e6d0b8', hemiGround: '#c8ad8a', hemi: .34, top: '#4a74b8', horizon: '#f0caa2' },
  // Sunset on the west beach: the sun sits low over the sea, straight ahead of the last camera.
  { p: 1, sun: [-40, 4.2, 9], color: '#ff9550', intensity: 2.8, hemiSky: '#e8b59a', hemiGround: '#9a7a66', hemi: .42, top: '#5a78b4', horizon: '#f5ad78' },
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
  // Dusk, not night: lamps, windows and festoons come on as the sun touches the sea.
  sky.night.value = Math.min(1, Math.max(0, (p - .88) / .12)) * .35;
  sky.warmth.value = Math.min(1, Math.max(0, (p - .7) / .26));
  sun.position.copy(sky.sunDir).multiplyScalar(45);
  sun.color.copy(linKeys[i].color).lerp(linKeys[i + 1].color, f);
  sun.intensity = a.intensity + (b.intensity - a.intensity) * f;
  hemi.color.copy(linKeys[i].hemiSky).lerp(linKeys[i + 1].hemiSky, f);
  hemi.groundColor.copy(linKeys[i].hemiGround).lerp(linKeys[i + 1].hemiGround, f);
  hemi.intensity = a.hemi + (b.hemi - a.hemi) * f;
  if (scene.background instanceof Color) scene.background.copy(linKeys[i].horizon).lerp(linKeys[i + 1].horizon, f);
  if (scene.fog instanceof Fog) scene.fog.color.copy(linKeys[i].horizon).lerp(linKeys[i + 1].horizon, f);
}

