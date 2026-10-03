import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, ShaderMaterial } from 'three';
import { journey } from '../data/journey';
import { sky } from './daylight';

// "De otro mundo." traced in the sand in front of the arrival camera. It writes itself left to right
// once the world is shown and blows away with the sand as soon as the visitor starts scrolling.
const TEXT = 'De otro mundo.';
export function SandTitle() {
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; return c; }, []);
  const texture = useMemo(() => new CanvasTexture(canvas), [canvas]);
  useEffect(() => {
    const draw = () => {
      const k = canvas.getContext('2d')!;
      k.clearRect(0, 0, 1024, 256); k.textAlign = 'center'; k.textBaseline = 'middle';
      k.font = '150px "Caveat Brush", "Segoe Script", cursive'; k.fillStyle = '#ffffff'; k.fillText(TEXT, 512, 136);
      texture.needsUpdate = true;
    };
    draw();
    document.fonts?.load('150px "Caveat Brush"').then(draw).catch(() => {});
  }, [canvas, texture]);
  const material = useMemo(() => new ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    uniforms: { uMap: { value: texture }, uReveal: { value: 0 }, uErase: { value: 0 }, uNight: sky.night },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D uMap;uniform float uReveal,uErase,uNight;varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        float a=texture2D(uMap,vUv).a;
        // Written left to right with a slightly ragged pen edge.
        a*=step(vUv.x,uReveal*1.08-h(vec2(floor(vUv.y*40.),0.))*.04);
        // Wind erase: grains vanish in a noisy front that sweeps from the right.
        float grain=h(floor(vUv*vec2(160.,40.)));
        a*=step(uErase*1.3,grain*.6+vUv.x*.7);
        if(a<.02)discard;
        vec3 groove=vec3(.6,.51,.38)*(1.-.65*uNight);
        gl_FragColor=vec4(groove,a*.85);
      }`,
  }), [texture]);
  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += Math.min(dt, .05);
    material.uniforms.uReveal.value = journey.reduced ? 1 : Math.min(1, Math.max(0, (time.current - 2.6) / 2.2));
    material.uniforms.uErase.value = Math.min(1, journey.rendered / .06);
  });
  // Anamorphic, like road lettering: the plane is deep so the letters, stretched along z, read
  // with normal proportions from the low arrival camera.
  return <mesh material={material} position={[.3, .1, 5.95]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={() => {}}>
    <planeGeometry args={[2.6, 2.9]} />
  </mesh>;
}
