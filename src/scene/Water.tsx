import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Water } from 'three/addons/objects/Water.js';
import { DataTexture, PlaneGeometry, RepeatWrapping, RGBAFormat, Vector3 } from 'three';
import { journey } from '../data/journey';
function normals(){const n=256,data=new Uint8Array(n*n*4);const wave=(x:number,y:number)=>{let v=0;for(let k=1;k<9;k++){const a=k*2.399;v+=Math.sin(x*Math.round(Math.cos(a)*k*2)+y*Math.round(Math.sin(a)*k*2)+k)*.18/k;}return v;};for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n*Math.PI*2,v=y/n*Math.PI*2,dx=(wave(u+.01,v)-wave(u-.01,v))/.02,dy=(wave(u,v+.01)-wave(u,v-.01))/.02,normal=new Vector3(-dx,-dy,2).normalize(),i=(y*n+x)*4;data[i]=(normal.x*.5+.5)*255;data[i+1]=(normal.y*.5+.5)*255;data[i+2]=(normal.z*.5+.5)*255;data[i+3]=255;}const t=new DataTexture(data,n,n,RGBAFormat);t.wrapS=t.wrapT=RepeatWrapping;t.needsUpdate=true;return t;}
export function ReflectiveWater(){const water=useMemo(()=>{const w=new Water(new PlaneGeometry(700,700),{textureWidth:512,textureHeight:512,waterNormals:normals(),sunDirection:new Vector3(-18,30,12).normalize(),sunColor:0xfff4db,waterColor:0x16a494,distortionScale:1.5,fog:true});w.rotation.x=-Math.PI/2;w.position.y=-.31;w.material.uniforms.size.value=5;
 w.material.fragmentShader=w.material.fragmentShader.replace('float rf0 = 0.3;','float rf0 = 0.02;').replace('( 1.0 - rf0 ) * pow','0.45 * pow').replace('vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;',`float edge = length((worldPosition.xz-vec2(0.,8.))/vec2(22.,22.));
 float deep = smoothstep(1.,4.8,edge);
 vec3 seabed = mix(vec3(.05,.58,.43),vec3(.004,.075,.14),deep);
 float caustic = pow(max(0.,sin(worldPosition.x*.9+sin(worldPosition.z*.8+time*.4))*sin(worldPosition.z*1.1+sin(worldPosition.x*.7-time*.3))),10.);
 seabed += caustic*.055*(1.-deep);
 vec3 scatter = max(.38,dot(surfaceNormal,eyeDirection))*seabed;`);return w;},[]);
 useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)water.material.uniforms.time.value+=dt*.45;});return <primitive object={water}/>;}
