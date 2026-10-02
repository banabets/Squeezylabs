import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/** Opt-in development instrumentation. Counts the previous completed renderer frame. */
export function PerformanceProbe() {
 const output=useRef<HTMLOutputElement|null>(null), samples=useRef<number[]>([]);
 useEffect(()=>{if(!import.meta.env.DEV||!new URLSearchParams(location.search).has('perf'))return;
 const el=document.createElement('output');el.dataset.testid='performance';el.style.cssText='position:fixed;top:85px;right:20px;z-index:1000;background:#081710e8;color:#daff91;padding:10px;font:12px monospace;pointer-events:none';document.body.append(el);output.current=el;
 return()=>{el.remove();output.current=null;};},[]);
 useFrame(({gl},dt)=>{if(!output.current)return; samples.current.push(dt*1000);if(samples.current.length<120)return;
 const a=samples.current.sort((a,b)=>a-b);output.current.textContent=`${(1000/(a.reduce((s,n)=>s+n,0)/a.length)).toFixed(1)} FPS · p95 ${a[Math.floor(a.length*.95)].toFixed(1)} ms · ${gl.info.render.calls} draws · ${gl.info.render.triangles.toLocaleString()} triangles`;samples.current=[];
 });return null;
}
