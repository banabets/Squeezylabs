import {useEffect,useState} from 'react';

export function SignalGame(){
 const [running,setRunning]=useState(false),[score,setScore]=useState(0),[left,setLeft]=useState(20),[target,setTarget]=useState(4);
 useEffect(()=>{if(!running)return;const timer=setInterval(()=>setLeft(n=>Math.max(0,n-1)),1000);return()=>clearInterval(timer);},[running]);
 useEffect(()=>{if(left===0)setRunning(false);},[left]);
 return <section className="signal-game" aria-label="Squeezy signal game"><div className="signal-meta"><span>SEÑAL / {String(score).padStart(2,'0')}</span><span>{left}s</span></div><p>Captura la señal verde antes de que vuelva al espacio.</p><div className="signal-grid">{Array.from({length:9},(_,i)=><button key={i} disabled={!running} className={running&&target===i?'lit':''} aria-label={`Señal ${i+1}${target===i?' activa':''}`} onClick={()=>{if(i!==target)return;setScore(n=>n+1);setTarget((i+1+Math.floor(Math.random()*8))%9);}}>{running&&target===i?'✳':'·'}</button>)}</div><button className="pill" onClick={()=>{setScore(0);setLeft(20);setTarget(4);setRunning(true);}}>{running?'Reiniciar':left===0?'Volver a jugar':'Encender la arcade'} ↗</button><p role="status">{left===0?`${score} señales capturadas. Misión completada.`:'Demo interactiva del laboratorio.'}</p></section>;
}
