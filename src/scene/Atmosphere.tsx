import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide } from 'three';
import { journey } from '../data/journey';
import { sky } from './daylight';

// Sky dome that follows the day cycle: gradient, sun (or moon) glow, stars at night and haze at the horizon.
// Clouds are real low-poly meshes now (Weather.tsx) so they can cast shadows.
export function Atmosphere(){
 const uniforms=useMemo(()=>({uTop:{value:sky.top},uHor:{value:sky.horizon},uSun:{value:sky.sunDir},uSunCol:{value:sky.sunColor},uTime:{value:0},uNight:sky.night}),[]);
 useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)uniforms.uTime.value+=dt;});
 return <mesh><sphereGeometry args={[500,32,16]}/><shaderMaterial side={BackSide} depthWrite={false} toneMapped={false} uniforms={uniforms} vertexShader={`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`uniform vec3 uTop,uHor,uSun,uSunCol;uniform float uTime,uNight;varying vec3 vDirection;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec3 sky=mix(uHor,uTop,pow(h,.42));float s=max(0.,dot(d,normalize(uSun)));sky+=uSunCol*(pow(s,500.)*1.2+pow(s,7.)*.2);
 vec2 sc=vec2(atan(d.z,d.x)*260.,d.y*260.);float star=step(.9965,hash(floor(sc)))*(.6+.4*sin(uTime*2.+hash(floor(sc)+3.)*30.));
 sky+=vec3(.95,.97,1.)*star*uNight*smoothstep(.04,.25,h);sky=mix(sky,uHor,(1.-smoothstep(0.,.08,h))*.6);gl_FragColor=vec4(sky,1.);}`}/></mesh>;}
