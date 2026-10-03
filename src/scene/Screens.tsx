import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Mesh, MeshBasicMaterial, SRGBColorSpace, Vector3, VideoTexture } from 'three';
import { journey } from '../data/journey';
import { reels, type Reel } from '../data/projects';

type Draw = (k: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
const rr = (k: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { k.beginPath(); k.roundRect(x, y, w, h, r); };

// Animated mock-ups, one per kind of work, drawn in the site palette.
const MOCK: Record<Reel['kind'], Draw> = {
  web(k, w, h, t) {
    k.fillStyle = '#fbf7ee'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#12302e'; k.fillRect(0, 0, w, h * .12);
    k.fillStyle = '#a8ed00'; rr(k, w * .04, h * .035, w * .1, h * .05, 6); k.fill();
    const y0 = h * .16 - (t * 24 % (h * .9));
    for (let r = 0; r < 4; r++) {
      const y = y0 + r * h * .45;
      k.fillStyle = r % 2 ? '#d7eef2' : '#f2c9b4'; rr(k, w * .05, y, w * .55, h * .3, 10); k.fill();
      k.fillStyle = '#e3d6bb'; for (let i = 0; i < 4; i++) k.fillRect(w * .65, y + i * h * .07, w * (.28 - i * .04), h * .03);
    }
  },
  game(k, w, h, t) {
    k.fillStyle = '#16302b'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#1f8fa6'; k.fillRect(0, h * .78, w, h * .22);
    for (let i = 0; i < 4; i++) { const bx = (w - ((t * 160 + i * w * .3) % (w + 60))); k.fillStyle = '#d26a43'; k.fillRect(bx, h * .68, w * .06, h * .1); }
    const jump = Math.abs(Math.sin(t * 3.2)) * h * .25;
    k.fillStyle = '#a8ed00'; k.beginPath(); k.ellipse(w * .25, h * .66 - jump, w * .045, h * .1, 0, 0, 7); k.fill();
    k.fillStyle = '#fbf7ee'; k.font = `600 ${h * .08}px "DM Sans", sans-serif`; k.fillText(`${Math.floor(t * 10) % 1000}`.padStart(4, '0'), w * .82, h * .13);
  },
  app(k, w, h, t) {
    k.fillStyle = '#2a3f6b'; k.fillRect(0, 0, w, h);
    const pw = h * .5, px = (w - pw) / 2;
    k.fillStyle = '#fbf7ee'; rr(k, px, h * .06, pw, h * .88, 18); k.fill();
    k.fillStyle = '#a8ed00'; rr(k, px + pw * .1, h * .12, pw * .8, h * .12, 8); k.fill();
    for (let i = 0; i < 5; i++) {
      const y = h * .3 + i * h * .12, slide = Math.max(0, 1 - ((t * 1.5 - i * .25) % 4)) * pw * .5;
      k.fillStyle = '#e3d6bb'; rr(k, px + pw * .1 + slide, y, pw * .8, h * .08, 6); k.fill();
    }
  },
};

function label(k: CanvasRenderingContext2D, h: number, text: string) {
  k.font = `700 ${h * .07}px "DM Sans", sans-serif`;
  const tw = k.measureText(text).width;
  k.fillStyle = 'rgba(12,29,27,.78)'; rr(k, h * .04, h * .86, tw + h * .08, h * .1, 6); k.fill();
  k.fillStyle = '#fbf7ee'; k.fillText(text, h * .08, h * .935);
}

/** A screen that plays the studio's reels: a real clip when one is set, otherwise an animated demo. */
export function ProjectScreen({ size, position, reel, cycle = false, onSelect }: { size: [number, number]; position: [number, number, number]; reel?: number; cycle?: boolean; onSelect?: () => void }) {
  const ref = useRef<Mesh>(null);
  const W = 512, H = Math.round(512 * size[1] / size[0]);
  const { ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace;
    return { ctx: canvas.getContext('2d')!, texture };
  }, [W, H]);
  // Real clips: one muted, looping video per reel that has one.
  const videos = useMemo(() => reels.map(r => {
    if (!r.video) return null;
    const v = document.createElement('video'); v.src = r.video; v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = 'anonymous';
    const tex = new VideoTexture(v); tex.colorSpace = SRGBColorSpace; return { v, tex };
  }), []);
  useEffect(() => () => videos.forEach(x => { if (x) { x.v.pause(); x.tex.dispose(); } }), [videos]);
  const state = useRef({ t: 0, acc: 0, current: -1 }), world = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, dt) => {
    const s = state.current, mesh = ref.current; if (!mesh) return;
    if (!journey.paused && !journey.reduced) s.t += Math.min(dt, .05);
    mesh.getWorldPosition(world);
    if (camera.position.distanceTo(world) > 30) return; // only animate when close enough to see
    const index = cycle ? Math.floor(s.t / 6) % reels.length : (reel ?? 0), r = reels[index], video = videos[index];
    if (index !== s.current) {
      s.current = index; videos.forEach((x, i) => { if (x) { if (i === index) x.v.play().catch(() => {}); else x.v.pause(); } });
      const m = mesh.material as MeshBasicMaterial; m.map = video ? video.tex : texture; m.needsUpdate = true;
    }
    if (video) return;
    s.acc += dt; if (s.acc < 1 / 15) return; s.acc = 0; // 15 fps is plenty for a screen in the scene
    MOCK[r.kind](ctx, W, H, s.t);
    label(ctx, H, `DEMO · ${r.title}`);
    texture.needsUpdate = true;
  });
  return <mesh ref={ref} position={position} onClick={onSelect} onPointerOver={onSelect ? () => { document.body.style.cursor = 'pointer'; } : undefined} onPointerOut={onSelect ? () => { document.body.style.cursor = 'auto'; } : undefined}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}

// Attract mode for the arcade cabinet: mangos falling into a basket, inviting a click.
export function ArcadeScreen({ size, position, onSelect }: { size: [number, number]; position: [number, number, number]; onSelect: () => void }) {
  const W = 384, H = Math.round(384 * size[1] / size[0]);
  const { ctx, texture } = useMemo(() => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const texture = new CanvasTexture(c); texture.colorSpace = SRGBColorSpace; return { ctx: c.getContext('2d')!, texture };
  }, [W, H]);
  const s = useRef({ t: 0, acc: 0 });
  useFrame((_, dt) => {
    const st = s.current; if (!journey.paused && !journey.reduced) st.t += Math.min(dt, .05);
    st.acc += dt; if (st.acc < 1 / 12) return; st.acc = 0;
    const t = st.t, k = ctx;
    k.fillStyle = '#16302b'; k.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const x = W * (.12 + i * .19), y = ((t * 70 + i * 53) % (H * .9)); k.fillStyle = ['#ef8a2a', '#e6b230', '#a9b23a'][i % 3]; k.beginPath(); k.ellipse(x, y, W * .04, H * .06, .3, 0, 7); k.fill(); }
    const bx = W * .5 + Math.sin(t * 1.8) * W * .3; k.fillStyle = '#c8a26e'; k.fillRect(bx - W * .09, H * .82, W * .18, H * .08);
    k.fillStyle = '#a8ed00'; k.font = `700 ${H * .1}px "DM Sans", sans-serif`; k.textAlign = 'center';
    if (Math.floor(t * 2) % 2) k.fillText('TOCA PARA JUGAR', W / 2, H * .18);
    k.textAlign = 'left'; texture.needsUpdate = true;
  });
  return <mesh position={position} onClick={e => { e.stopPropagation(); onSelect(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
    <planeGeometry args={size} />
    <meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}
