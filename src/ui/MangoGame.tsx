import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n';

// "Atrapa mangos": the game the arcade cabinet advertises. 30 seconds, move the basket with the
// pointer, a finger or the arrow keys. Ripe mangos +1, golden +3, coconuts −2.
const DURATION = 30;
type Fruit = { x: number; y: number; v: number; kind: 'mango' | 'gold' | 'coco'; spin: number };
const readBest = () => { try { return Number(localStorage.getItem('squeezy-mango-best') || 0); } catch { return 0; } };
const writeBest = (n: number) => { try { localStorage.setItem('squeezy-mango-best', String(n)); } catch { /* storage blocked */ } };

export function MangoGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const es = useLang() === 'es';
  const [phase, setPhase] = useState<'idle' | 'play' | 'over'>('idle');
  const [score, setScore] = useState(0), [left, setLeft] = useState(DURATION), [best, setBest] = useState(readBest);
  const game = useRef({ basket: .5, keys: 0, fruits: [] as Fruit[], spawn: 0, score: 0, time: 0, pops: [] as { x: number; y: number; text: string; life: number }[] });

  useEffect(() => {
    if (phase !== 'play') return;
    const c = canvas.current!, k = c.getContext('2d')!, g = game.current;
    let raf = 0, last = performance.now();
    const W = () => c.width, H = () => c.height;
    const frame = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now; g.time += dt;
      const remaining = Math.max(0, DURATION - g.time);
      g.basket = Math.min(.95, Math.max(.05, g.basket + g.keys * dt * 1.1));
      g.spawn -= dt;
      if (g.spawn <= 0) {
        const r = Math.random();
        g.fruits.push({ x: .06 + Math.random() * .88, y: -.08, v: .32 + g.time * .012 + Math.random() * .15, kind: r < .1 ? 'gold' : r < .3 ? 'coco' : 'mango', spin: Math.random() * 6 });
        g.spawn = Math.max(.28, .75 - g.time * .015);
      }
      const bx = g.basket * W(), by = H() * .88, bw = W() * .16;
      g.fruits = g.fruits.filter(f => {
        f.y += f.v * dt; f.spin += dt * 2;
        const fx = f.x * W(), fy = f.y * H();
        if (fy > by - 10 && fy < by + 14 && Math.abs(fx - bx) < bw / 2) {
          const pts = f.kind === 'gold' ? 3 : f.kind === 'coco' ? -2 : 1;
          g.score = Math.max(0, g.score + pts); setScore(g.score);
          g.pops.push({ x: fx, y: by - 20, text: pts > 0 ? `+${pts}` : `${pts}`, life: .8 });
          return false;
        }
        return f.y < 1.1;
      });
      // Draw
      k.fillStyle = '#16302b'; k.fillRect(0, 0, W(), H());
      k.fillStyle = '#1f8fa6'; k.fillRect(0, H() * .93, W(), H() * .07);
      for (const f of g.fruits) {
        const fx = f.x * W(), fy = f.y * H(), r = H() * .045;
        k.save(); k.translate(fx, fy); k.rotate(Math.sin(f.spin) * .4);
        if (f.kind === 'coco') { k.fillStyle = '#6b4a2b'; k.beginPath(); k.arc(0, 0, r, 0, 7); k.fill(); k.fillStyle = '#3b2a18'; k.beginPath(); k.arc(-r * .3, -r * .2, r * .14, 0, 7); k.arc(r * .2, -r * .3, r * .14, 0, 7); k.fill(); }
        else { k.fillStyle = f.kind === 'gold' ? '#ffd23f' : '#ef8a2a'; k.beginPath(); k.ellipse(0, 0, r * .85, r * 1.1, .3, 0, 7); k.fill(); k.fillStyle = '#3f8f45'; k.beginPath(); k.ellipse(r * .35, -r * 1.05, r * .35, r * .15, -.6, 0, 7); k.fill(); if (f.kind === 'gold') { k.strokeStyle = '#fff6c2'; k.lineWidth = 2; k.stroke(); } }
        k.restore();
      }
      k.fillStyle = '#c8a26e'; k.beginPath(); k.roundRect(bx - bw / 2, by - 6, bw, H() * .07, 6); k.fill();
      k.fillStyle = '#a07a48'; for (let i = 1; i < 4; i++) k.fillRect(bx - bw / 2 + i * bw / 4, by - 6, 2, H() * .07);
      g.pops = g.pops.filter(p => { p.life -= dt; p.y -= dt * 40; k.globalAlpha = Math.max(0, p.life / .8); k.fillStyle = p.text.startsWith('+') ? '#a8ed00' : '#ff8a7a'; k.font = `700 ${H() * .07}px "DM Sans", sans-serif`; k.textAlign = 'center'; k.fillText(p.text, p.x, p.y); k.globalAlpha = 1; return p.life > 0; });
      k.textAlign = 'left';
      setLeft(Math.ceil(remaining));
      if (remaining <= 0) {
        setPhase('over');
        if (g.score > readBest()) { writeBest(g.score); setBest(g.score); }
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const key = (e: KeyboardEvent, down: boolean) => { if (e.key === 'ArrowLeft') { g.keys = down ? -1 : 0; e.preventDefault(); } if (e.key === 'ArrowRight') { g.keys = down ? 1 : 0; e.preventDefault(); } };
    const kd = (e: KeyboardEvent) => key(e, true), ku = (e: KeyboardEvent) => key(e, false);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [phase]);

  const start = () => { Object.assign(game.current, { basket: .5, keys: 0, fruits: [], spawn: 0, score: 0, time: 0, pops: [] }); setScore(0); setLeft(DURATION); setPhase('play'); };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => { const r = e.currentTarget.getBoundingClientRect(); game.current.basket = (e.clientX - r.left) / r.width; };

  return <section className="mango-game" aria-label={es ? 'Atrapa mangos' : 'Catch the mangos'}>
    <div className="signal-meta"><span>MANGOS / {String(score).padStart(2, '0')}</span><span>{left}s</span></div>
    <div className="mango-stage">
      <canvas ref={canvas} width={560} height={340} onPointerMove={move} onPointerDown={move} aria-label={es ? 'Tablero del juego: mueve la cesta para atrapar mangos' : 'Game board: move the basket to catch mangos'} />
      {phase !== 'play' && <div className="mango-overlay">
        <p>{phase === 'over' ? (es ? `¡${score} ${score === 1 ? 'punto' : 'puntos'}!${score >= best && score > 0 ? ' Nuevo récord.' : ''}` : `${score} ${score === 1 ? 'point' : 'points'}!${score >= best && score > 0 ? ' New best.' : ''}`) : (es ? 'Atrapa los mangos, esquiva los cocos.' : 'Catch the mangos, dodge the coconuts.')}</p>
        <button className="pill" onClick={start}>{phase === 'over' ? (es ? 'Jugar otra vez' : 'Play again') : (es ? 'Jugar' : 'Play')} ↗</button>
      </div>}
    </div>
    <p role="status">{es ? 'Mango +1 · mango dorado +3 · coco −2. Mueve la cesta con el mouse, el dedo o las flechas. Tu récord: ' : 'Mango +1 · golden mango +3 · coconut −2. Move the basket with the mouse, a finger or the arrow keys. Your best: '}{best}.</p>
  </section>;
}
