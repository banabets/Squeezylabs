import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
let sand:CanvasTexture|undefined, plaster:CanvasTexture|undefined;
function grain(base:string,mode:'sand'|'plaster'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
 let seed=71;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 for(let i=0;i<35000;i++){const value=random()>.5?255:50;ctx.fillStyle=`rgba(${value},${value*.92},${value*.75},${random()*(mode==='sand'?.10:.045)})`;const size=random()*1.5+.3;ctx.fillRect(random()*512,random()*512,size,size);}
 if(mode==='sand')for(let i=0;i<700;i++){ctx.fillStyle=`rgba(127,103,64,${random()*.1})`;ctx.beginPath();ctx.ellipse(random()*512,random()*512,random()*14+3,random()*4+1,random()*6,0,Math.PI*2);ctx.fill();}
 const tex=new CanvasTexture(canvas);tex.wrapS=tex.wrapT=RepeatWrapping;tex.repeat.set(mode==='sand'?.7:.8,mode==='sand'?.7:.8);tex.colorSpace=SRGBColorSpace;tex.anisotropy=4;return tex;
}
export const sandTexture=()=>sand??(sand=grain('#f4dfb2','sand'));
export const plasterTexture=()=>plaster??(plaster=grain('#fff9e7','plaster'));
