import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Experience } from '../experience/Experience';
import { chapterAt, chapters, goTo, journey } from '../data/journey';
import { money, productKeys, services, storeItems } from '../data/store';
import { useProgress } from '@react-three/drei';
import { setAmbientSound } from './sound';
import { MangoGame } from './MangoGame';
import { CatchToast } from './CatchToast';
class WorldBoundary extends Component<{children:ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="fallback"><h1>A little pause in paradise.</h1><p>The 3D world could not start. Enable hardware acceleration, then reload.</p><button onClick={()=>location.reload()}>Try again</button></div>:this.props.children;}}
const details:Record<string,{label:string;title:string;copy:string;foot:string}>={
 games:{label:'GAMES / WORK IN PROGRESS',title:'A place for play.',copy:'We make worlds you can get lost in, and little moments that stay with you. This coastal arcade is the first home for our future game projects.',foot:'Project showcase coming soon. No game releases are announced here.'},
 web:{label:'WEBS & APPS',title:'Useful can be delightful.',copy:'Websites, apps and digital products with a little personality. Thoughtful interfaces, playful details, and experiences that feel good to use.',foot:'Have a digital idea? Let’s find its shape.'},
 experiments:{label:'THE EXPERIMENT SHELF',title:'Curiosity, on repeat.',copy:'Some ideas start without a brief. A squishy shape. An unexpected interaction. A tiny prototype that turns into something bigger.',foot:'Try squeezing the little experiment below.'},
 about:{label:'ABOUT SQUEEZY LABS',title:'A small lab. An open horizon.',copy:'Squeezy Labs is a creative digital studio making games, websites, apps and experimental experiences. Our world takes its warmth, color and curiosity from Venezuela.',foot:'Made in Venezuela. Built for everywhere.'},
 contact:{label:'LA LIBRETA / CUSTOM WORK',title:'What should we write down?',copy:'Tell us what you have in mind: a website, an app, a game or something a little unusual. Save a project brief below to start the conversation.',foot:'This is a first prototype. Contact delivery is not connected yet; your brief stays on your device.'},
 shop:{label:'LA BODEGA / THE SHELF',title:'Take something home.',copy:'A prototype shelf of digital ideas. Explore the demos or tell us what we can build for you.',foot:'Products and prices are placeholders until the catalog is approved.'},
 cart:{label:'LA BODEGA / YOUR TAB',title:'La cuenta.',copy:'Everything you picked from the shelf.',foot:'Prototype checkout: no payment provider is connected and nothing is charged.'},
};
const ctaFor:Record<string,{text:string;modal:string;pill?:boolean}>={
 'Arrival':{text:'Explore the lab',modal:'',pill:true},
 'Games':{text:'Meet our playful side',modal:'games'},
 'Web & apps':{text:'Explore our digital side',modal:'web'},
 'Experiments':{text:'Take a closer look',modal:'experiments'},
 'La bodega':{text:'Step inside',modal:'shop',pill:true},
 'The bigger picture':{text:'Let’s make something',modal:'contact',pill:true},
};
export function App(){
 const {progress:assetProgress}=useProgress();
 const [ready,setReady]=useState(false),[progress,setProgress]=useState(0),[chapter,setChapter]=useState(0),[modal,setModal]=useState<string|null>(null),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(false),[squeezed,setSqueezed]=useState(false),[saved,setSaved]=useState(false);
 const [sound,setSound]=useState(false);
 const [greet,setGreet]=useState(false),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{if(!ready)return;const id=setTimeout(()=>setGreet(true),5200);return()=>clearTimeout(id);},[ready]);
 const [cart,setCart]=useState<Record<string,number>>({}),[payStatus,setPayStatus]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const onReady=useCallback(()=>setReady(true),[]);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{setReduced(media.matches);journey.reduced=media.matches;};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{let frame=0;let last=0;const tick=(t:number)=>{if(t-last>65){setProgress(journey.rendered);setChapter(chapterAt(journey.rendered));document.body.classList.toggle('travelling',Math.abs(journey.progress-journey.rendered)>.004);last=t;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);document.body.classList.remove('travelling');};},[]);
 useEffect(()=>{if(modal){lastFocus.current=document.activeElement as HTMLElement;if(!dialog.current?.open)dialog.current?.showModal();document.body.style.overflow='hidden';}else{dialog.current?.close();document.body.style.overflow='';lastFocus.current?.focus();}return()=>{document.body.style.overflow='';};},[modal]);
 // Dev only: ?p=0.82 jumps straight to a point on the journey for screenshots.
 useEffect(()=>{if(!import.meta.env.DEV||!ready)return;const p=new URLSearchParams(location.search).get('p');if(p===null)return;const v=+p;window.scrollTo(0,v*(document.documentElement.scrollHeight-innerHeight));journey.progress=journey.rendered=v;},[ready]);
 const open=useCallback((name:string)=>{setSaved(false);setPayStatus('');setModal(name);},[]);
 const select=useCallback((key:string)=>{const item=storeItems[key];if(!item)return open(key);open(item.kind==='hire'?'contact':'item:'+key);},[open]);
 const add=(key:string)=>setCart(c=>({...c,[key]:(c[key]||0)+1}));
 const change=(key:string,d:number)=>setCart(c=>{const n={...c,[key]:Math.max(0,(c[key]||0)+d)};if(!n[key])delete n[key];return n;});
 const count=Object.values(cart).reduce((a,b)=>a+b,0),total=Object.entries(cart).reduce((a,[k,q])=>a+q*(storeItems[k].price||0),0);
 const c=chapters[chapter],cta=ctaFor[c.name];
 const item=modal?.startsWith('item:')?storeItems[modal.slice(5)]:null,itemKey=modal?.slice(5)||'';
 const info=modal&&!item?details[modal]:null;
 return <>
 <WorldBoundary><Experience onReady={onReady} onSelect={select}/><CatchToast onOpen={open}/></WorldBoundary>
 <div className={`loader ${ready?'loaded':''}`} aria-hidden={ready}><img className="loader-symbol" src="/brand/squeezy.png" alt="Squeezy Labs"/><div className="loader-mark">squeezy<span>®</span></div><p>Loading the world… {Math.round(ready?100:assetProgress)}%</p><div className="load-line" role="progressbar" aria-label="World loading" aria-valuenow={Math.round(ready?100:assetProgress)} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${ready?100:assetProgress}%`}}/></div><span className="loader-note">A little closer to somewhere good.</span></div>
 <div className="vignette"/>
 {ready&&greet&&!dismissed&&progress<.105&&<aside className="transmission" aria-label="Mensaje de Squeezy"><div><span className="signal-dot"/> TRANSMISIÓN / SQUEEZY LABS<button aria-label="Cerrar bienvenida" onClick={()=>setDismissed(true)}>×</button></div><p>Hola, terrícola.<br/><em>Bienvenido a mi mundo.</em></p><button className="text-button" onClick={()=>goTo(chapters[1].progress)}>Vamos a explorar ↗</button></aside>}
 <header className="header"><button className="wordmark" onClick={()=>goTo(0)} aria-label="Squeezy Labs, back to arrival">squeezy<img className="brand-symbol" src="/brand/squeezy.png" alt=""/><small>LABS</small></button><nav aria-label="Main navigation"><button onClick={()=>goTo(chapters[1].progress)}>Projects</button><button onClick={()=>goTo(chapters[3].progress)}>The lab</button><button onClick={()=>goTo(chapters[4].progress)}>Bodega</button><button onClick={()=>open('about')}>About</button><button className="tab-nav" onClick={()=>open('cart')} aria-label={`Your tab: ${count} items, ${money(total)}`}>Tab <b>{count}</b></button><button className="contact-nav" onClick={()=>open('contact')}>Let’s talk <span>↗</span></button></nav></header>
 <main className="scroll-track" aria-label="Scroll to explore the Squeezy world"><div className="chapter-content" key={chapter}><p className="eyebrow">{c.label}</p><h1>{c.title.split('\n').map((line,i)=><span key={i}>{line}</span>)}</h1><p className="chapter-copy">{c.copy}</p>
 {cta.pill?<button className="pill" onClick={()=>cta.modal?open(cta.modal):goTo(chapters[1].progress)}>{cta.text} <span>{cta.modal?'↗':'↘'}</span></button>:<button className="text-button" onClick={()=>open(cta.modal)}>{cta.text} <span>↗</span></button>}
 {c.name==='La bodega'&&<button className="text-button bodega-alt" onClick={()=>open('contact')}>Order custom work <span>↗</span></button>}
 </div></main>
 <aside className="location"><span className="location-icon">✳</span><div>Caribe venezolano<small>VENEZUELAN ROOTS. OPEN HORIZONS.</small></div></aside>
 <div className="side-progress" aria-hidden="true"><span>{String(chapter+1).padStart(2,'0')}</span><i><b style={{height:`${progress*100}%`}}/></i><span>{String(chapters.length).padStart(2,'0')}</span></div>
 <footer className="journey-bar"><span className="scroll-hint"><span className="mouse-icon"/> Scroll to wander</span><nav aria-label="Journey chapters">{chapters.map((ch,i)=><button key={ch.name} onClick={()=>goTo(ch.progress)} className={chapter===i?'active':''} aria-current={chapter===i?'step':undefined}><span className="chapter-number">0{i+1}</span><span>{ch.short}</span></button>)}</nav><button className="motion-button sound-button" onClick={()=>{setAmbientSound(!sound);setSound(!sound);}} aria-pressed={sound} aria-label={sound?'Turn ambient sound off':'Turn ambient sound on'}>{sound?'♪':'♫'}</button><button className="motion-button" onClick={()=>{journey.paused=!paused;setPaused(!paused);}} aria-pressed={paused} aria-label={paused?'Resume ambient animation':'Pause ambient animation'}>{paused?'▷':'Ⅱ'}</button></footer>
 <div className="bottom-meta"><span>INDEPENDENT BY NATURE</span><span>10° N / 66° W <i>✳</i></span></div>
 <dialog ref={dialog} onCancel={()=>setModal(null)} onClick={e=>{if(e.target===dialog.current)setModal(null);}}><div className="dialog-inner"><button className="close" onClick={()=>setModal(null)} aria-label="Close dialog">×</button>
 {item&&<><p className="prototype-note">Concepto del laboratorio · catálogo de demostración</p><p className="eyebrow">{item.type.toUpperCase()}</p><h2>{item.name}</h2><p>{item.desc}</p>
  {item.kind==='product'?<div className="item-row"><strong>{money(item.price||0)}</strong><button className="pill" onClick={()=>add(itemKey)}>{cart[itemKey]?`On your tab (${cart[itemKey]}) · add one more`:'Add to tab'} <span>+</span></button></div>
  :<div className="item-row"><button className="pill" onClick={()=>open('shop')}>See the shelf <span>↗</span></button><button className="text-button dark" onClick={()=>open('contact')}>Order custom work ↗</button></div>}
  {item.kind==='product'&&count>0&&<button className="text-button dark" onClick={()=>open('cart')}>Go to your tab ({count}) ↗</button>}</>}
 {info&&<><p className="eyebrow">{info.label}</p><h2>{info.title}</h2><p>{info.copy}</p>
  {modal==='games'&&<MangoGame/>}
  {modal==='experiments'&&<button className={`squeeze-toy ${squeezed?'squeezed':''}`} onClick={()=>{setSqueezed(true);setTimeout(()=>setSqueezed(false),650);}} aria-label="Squeeze the experiment">✳</button>}
  {modal==='shop'&&<><p className="prototype-note">Catálogo de demostración. Los precios son ilustrativos; ningún producto está a la venta todavía.</p><div className="shelf">{productKeys.map(k=>{const p=storeItems[k],pk=p.pack!;return <article key={k} className="shelf-item"><div className="pack" style={{background:pk.bg,color:pk.fg}}><small>{pk.top}</small><span className="pt">{pk.t1}<i>{pk.t2}</i></span><span className="sticker">{money(p.price||0)}</span></div><h3>{p.name}</h3><p>{p.desc}</p><button className="pill" onClick={()=>add(k)}>{cart[k]?`On tab (${cart[k]})`:'Add to tab'} <span>+</span></button></article>;})}</div>
   <div className="board"><h3>Encargos del día</h3><ul>{services.map(s=><li key={s.name}><b>{s.name}</b><span>{s.price}</span><small>{s.note}</small></li>)}</ul><button className="pill" onClick={()=>open('contact')}>Write it in la libreta <span>↗</span></button></div>
   {count>0&&<button className="text-button dark" onClick={()=>open('cart')}>Go to your tab ({count} · {money(total)}) ↗</button>}</>}
  {modal==='cart'&&<form className="pay" onSubmit={e=>{e.preventDefault();setPayStatus(count?'Prototype: this is where the payment provider would open. Nothing was charged.':'Your tab is empty. Add something from the shelf first.');}}>
   <div className="ticket">{count===0?<p>Your tab is empty.</p>:Object.entries(cart).map(([k,q])=><div className="ticket-row" key={k}><span>{storeItems[k].name}</span><span className="qty"><button type="button" onClick={()=>change(k,-1)} aria-label={`Remove one ${storeItems[k].name}`}>−</button>{q}<button type="button" onClick={()=>change(k,1)} aria-label={`Add one ${storeItems[k].name}`}>+</button></span><span>{money(q*(storeItems[k].price||0))}</span></div>)}<div className="ticket-total"><span>Total</span><span>{money(total)}</span></div></div>
   <fieldset><legend>Pay with</legend><label className="opt"><input type="radio" name="pm" defaultChecked/> Card <small>Visa or Mastercard, from any country.</small></label><label className="opt"><input type="radio" name="pm"/> Zelle <small>We send the address for the transfer.</small></label><label className="opt"><input type="radio" name="pm"/> Pago móvil <small>In bolívares at the BCV rate of the day.</small></label></fieldset>
   <button className="pill" type="submit">Pay {money(total)}</button>{payStatus&&<p role="status" className="success">{payStatus}</p>}</form>}
  {modal==='contact'&&<form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const text=`Squeezy Labs — Project brief\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\n\n${data.get('idea')}`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='squeezy-project-brief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setSaved(true);}}><label>Your name<input name="name" autoComplete="name" required placeholder="A name to say hello to"/></label><label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label><label>What are you thinking?<textarea name="idea" required rows={3} placeholder="A game, an app, something a little unusual…"/></label><button className="pill" type="submit">Save my project brief</button>{saved&&<p role="status" className="success">Your brief is saved. Nothing has been sent.</p>}</form>}
  <p className="dialog-foot">{info.foot}</p>{modal!=='contact'&&<button className="text-button dark" onClick={()=>open('contact')}>Start a conversation ↗</button>}</>}
 </div></dialog>
 <span className="sr-only" role="status">Chapter {chapter+1}: {c.name}{reduced?'. Reduced motion enabled.':''}</span>
 </>;
}


