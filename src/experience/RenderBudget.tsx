import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';

/** Slow, one-way resolution adjustment prevents oscillation during camera travel. */
export function RenderBudget(){
 const setDpr=useThree(s=>s.setDpr),setFrameloop=useThree(s=>s.setFrameloop);
 const budget=useRef({elapsed:0,frames:0,warmup:0,dpr:Math.min(devicePixelRatio,1.5)});
 useEffect(()=>{const change=()=>{setFrameloop(document.hidden?'never':'always');budget.current.elapsed=0;budget.current.frames=0;};document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[setFrameloop]);
 useFrame((_,dt)=>{const b=budget.current;b.warmup+=dt;if(b.warmup<8||document.hidden||dt>.2)return;b.elapsed+=dt;b.frames++;if(b.elapsed<4)return;
 if(b.frames/b.elapsed<43&&b.dpr>1){b.dpr=Math.max(1,b.dpr-.25);setDpr(b.dpr);}b.elapsed=0;b.frames=0;
 });return null;
}
