import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ConeGeometry, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, RingGeometry, SphereGeometry } from 'three';
import { journey } from '../data/journey';
import { CATCHES, CATCH_EVENT } from '../data/catches';
import { flat } from './flat';

// A fishing float bobbing off the end of the pier. Click it: the float dips, a fish leaps out,
// and the UI shows what you caught with a link to that part of the site.
const SPOT: [number, number, number] = [-.9, -.27, -12.6];
export function FishingSpot() {
  const { root, bobber, fish, fishMats, ripple } = useMemo(() => {
    const root = new Group(), bobber = new Group();
    const top = new Mesh(new SphereGeometry(.11, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), flat('#d24a3a'));
    const bottom = new Mesh(new SphereGeometry(.11, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), flat('#fbf7ee'));
    const stick = new Mesh(new CylinderGeometry(.012, .012, .22, 5), flat('#2b2230')); stick.position.y = .16;
    bobber.add(top, bottom, stick); root.add(bobber);
    const fishMats = CATCHES.map(c => flat(c.color));
    const fish = new Group(); fish.visible = false;
    const body = new Mesh(new SphereGeometry(.18, 10, 7), fishMats[0]); body.scale.set(.55, .8, 1.6); fish.add(body);
    const tail = new Mesh(new ConeGeometry(.16, .26, 4), fishMats[0]); tail.rotation.x = Math.PI / 2; tail.position.z = -.38; tail.scale.x = .3; fish.add(tail);
    root.add(fish);
    const ripple = new Mesh(new RingGeometry(.14, .2, 24), new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .6, depthWrite: false, side: DoubleSide }));
    ripple.rotation.x = -Math.PI / 2; ripple.position.y = .02; root.add(ripple);
    root.traverse(o => { if (o instanceof Mesh) o.castShadow = o !== ripple; });
    return { root, bobber, fish, fishMats, ripple };
  }, []);
  const s = useRef({ t: 0, catchT: -1, n: 0 });
  useFrame((_, dt) => {
    const st = s.current; if (!journey.paused && !journey.reduced) st.t += Math.min(dt, .05);
    const t = st.t;
    bobber.position.y = Math.sin(t * 1.6) * .03;
    bobber.rotation.z = Math.sin(t * 1.1) * .12;
    const rp = (t * .5) % 1; ripple.scale.setScalar(1 + rp * 2.2); (ripple.material as MeshBasicMaterial).opacity = .55 * (1 - rp);
    if (st.catchT >= 0) {
      const k = (t - st.catchT) / 1.3;
      if (k >= 1) { st.catchT = -1; fish.visible = false; return; }
      bobber.position.y -= Math.sin(Math.min(1, k * 4) * Math.PI) * .12;
      fish.visible = true;
      fish.position.set(.35 + k * 1.1, Math.sin(k * Math.PI) * 1.4 - .1, 0);
      fish.rotation.set(Math.cos(k * Math.PI) * -1.1, Math.PI / 2, Math.sin(t * 20) * .2);
    }
  });
  const pull = () => {
    const st = s.current; if (st.catchT >= 0) return;
    const index = st.n++ % CATCHES.length;
    st.catchT = st.t;
    fish.children.forEach(c => { (c as Mesh).material = fishMats[index]; });
    window.dispatchEvent(new CustomEvent(CATCH_EVENT, { detail: index }));
  };
  return <group position={SPOT}>
    <primitive object={root} />
    {/* Generous invisible hit target so the small float is easy to click. */}
    <mesh onClick={e => { e.stopPropagation(); pull(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
      <sphereGeometry args={[.7, 8, 6]} /><meshBasicMaterial visible={false} />
    </mesh>
  </group>;
}
