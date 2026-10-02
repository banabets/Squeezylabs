import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils, PerspectiveCamera } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cameraPath, targetPath, journey } from '../data/journey';
gsap.registerPlugin(ScrollTrigger);
export function CameraRig({ onReady }: { onReady: () => void }) {
  const look = useRef(new Vector3());
  const point = useRef(new Vector3());
  const pointer = useRef({ x: 0, y: 0 });
  const frames = useRef(0);
  useEffect(() => { frames.current = 0; }, [onReady]);
  useEffect(() => {
    const trigger = ScrollTrigger.create({ trigger: '.scroll-track', start: 'top top', end: 'bottom bottom', onUpdate: self => { journey.progress = self.progress; } });
    const move = (e: PointerEvent) => { pointer.current.x = (e.clientX / innerWidth - .5) * .13; pointer.current.y = (e.clientY / innerHeight - .5) * .08; };
    window.addEventListener('pointermove', move);
    return () => { trigger.kill(); window.removeEventListener('pointermove', move); };
  }, []);
  useFrame(({ camera }, dt) => {
    journey.rendered = MathUtils.damp(journey.rendered, journey.progress, journey.reduced ? 20 : 4.2, Math.min(dt,.05));
    cameraPath.getPoint(journey.rendered, point.current);
    camera.position.copy(point.current);
    targetPath.getPoint(journey.rendered, look.current);
    if (!journey.reduced) { look.current.x += pointer.current.x; look.current.y -= pointer.current.y; }
    camera.lookAt(look.current);
    const cam = camera as PerspectiveCamera;
    const fov = innerWidth < 700 ? 66 : 53;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (++frames.current === 8) onReady();
  });
  return null;
}
