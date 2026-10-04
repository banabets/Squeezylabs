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
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.07+vec2(3.1,1.7);a*=.5;}return v;}
 void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec3 sky=mix(uHor,uTop,pow(h,.42));float s=max(0.,dot(d,normalize(uSun)));sky+=uSunCol*(pow(s,500.)*1.2+pow(s,7.)*.2);
 vec2 sc=vec2(atan(d.z,d.x)*260.,d.y*260.);float star=step(.9965,hash(floor(sc)))*(.6+.4*sin(uTime*2.+hash(floor(sc)+3.)*30.));
 sky+=vec3(.95,.97,1.)*star*uNight*smoothstep(.04,.25,h);
 // Soft cumulus on a flat cloud layer: sunlit edges, grey bellies, thinning toward the horizon.
 vec2 cuv=d.xz/(d.y+.12)*.9+vec2(uTime*.004,uTime*.002);float cd=fbm(cuv*1.6);float cov=smoothstep(.5,.78,cd)*smoothstep(.02,.22,h);
 vec3 cloudCol=mix(vec3(.78,.8,.84),vec3(1.,.99,.96),smoothstep(.5,.9,fbm(cuv*1.6+vec2(.08,.05))))*mix(vec3(1.),uSunCol*1.3,.35);
 cloudCol=mix(cloudCol,uHor,smoothstep(.25,.02,h)*.6);cloudCol*=1.-uNight*.8;
 sky=mix(sky,cloudCol,cov*.92);sky=mix(sky,uHor,(1.-smoothstep(0.,.08,h))*.6);gl_FragColor=vec4(pow(sky,vec3(mix(2.2,1.6,uNight)))*1.15,1.);}`}/></mesh>;}
