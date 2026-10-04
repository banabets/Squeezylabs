import { useMemo } from 'react';
import { BufferGeometry, CatmullRomCurve3, CylinderGeometry, Group, Mesh, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { flat } from './flat';

// Street wiring, the tangle every Venezuelan coastal street has: concrete poles with a crossarm,
// insulators and a pole-top transformer, and sagging cables that run to the bodega, the houses'
// meters. (The studio cottages get no overhead drop: those cables crossed the web & apps view through the palms.)
type V = [number, number, number];
const POLES: V[] = [[13.8, 0, .8], [11, 0, 14.2], [3.5, 0, 9]];
const ARM = 6.45;
const arm = (p: V, dx = 0, dz = 0): V => [p[0] + dx, ARM + .12, p[2] + dz];
// Each wire: from, to, sag in meters.
const WIRES: [V, V, number][] = [
  // Pole to pole along the plaza, three conductors.
  ...[-.55, 0, .55].map(o => [arm(POLES[0], o), arm(POLES[1], o), .55] as [V, V, number]),
  ...[-.55, .55].map(o => [arm(POLES[0], o), arm(POLES[2], o), .6] as [V, V, number]),
  // Service drops to the bodega facade and the houses' meters.
  [arm(POLES[0], .55), [18.95, 4.36, 3.1], .5], [arm(POLES[0], 0), [18.95, 4.3, 3.3], .65],
  [arm(POLES[1], .55), [18.95, 4.36, 10.9], .5],
  [arm(POLES[0], -.55), [13.84, 3.9, 2.56], .35],
  [arm(POLES[1], -.55), [15.66, 3.9, 15.54], .35],
];
const sagCurve = ([a, b, s]: [V, V, number]) => new CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => { const t = i / 12; return new Vector3(...a).lerp(new Vector3(...b), t).setY(a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * s); }));

export function PowerLines() {
  const group = useMemo(() => {
    const g = new Group(), concrete = flat('#b7b3aa', { roughness: .9 }), metal = flat('#6d7275', { roughness: .45 }), ceramic = flat('#e8e4da', { roughness: .3 }), cable = flat('#1c1c1c', { roughness: .6 });
    const parts: { concrete: BufferGeometry[]; metal: BufferGeometry[]; ceramic: BufferGeometry[] } = { concrete: [], metal: [], ceramic: [] };
    POLES.forEach((p, i) => {
      const pole = new CylinderGeometry(.1, .15, 7, 12); pole.translate(p[0], 3.5, p[2]); parts.concrete.push(pole);
      const cross = new CylinderGeometry(.05, .05, 1.5, 6); cross.rotateZ(Math.PI / 2); cross.translate(p[0], ARM, p[2]); parts.metal.push(cross);
      [-.55, 0, .55].forEach(o => { const ins = new CylinderGeometry(.035, .045, .14, 10); ins.translate(p[0] + o, ARM + .1, p[2]); parts.ceramic.push(ins); });
      if (i === 0) { const tr = new CylinderGeometry(.24, .24, .62, 16); tr.translate(p[0], 5.4, p[2] - .3); parts.metal.push(tr); }
    });
    const wires = WIRES.map(w => new TubeGeometry(sagCurve(w), 48, .011, 4));
    const add = (geos: BufferGeometry[], mat: ReturnType<typeof flat>, shadow = true) => { const m = new Mesh(mergeGeometries(geos.map(x => x.index ? x.toNonIndexed() : x))!, mat); m.castShadow = shadow; m.receiveShadow = true; m.raycast = () => {}; g.add(m); };
    add(parts.concrete, concrete); add(parts.metal, metal); add(parts.ceramic, ceramic); add(wires, cable);
    return g;
  }, []);
  return <primitive object={group} />;
}
