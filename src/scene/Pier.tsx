import { useMemo } from 'react';
import { BoxGeometry, CatmullRomCurve3, Color, CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, TorusGeometry, TubeGeometry, Vector3 } from 'three';
import { applyPbr } from './realism';
import { Model } from './Props';

// Muelle de pescadores: a plank walkway on round pilings that leaves the north beach and runs out over
// the shallows. Weathered boards of uneven tone (a couple missing), algae-dark pilings at the waterline,
// old tires tied on as fenders, a rope along one side and a crate at the far end.
const X = 1.2, Z0 = -7.3, Z1 = -21, DECK = .5, W = 1.7, BAY = 2.25;
const deckY = (z: number) => .16 + (DECK - .16) * Math.min(1, Math.max(0, (Z0 - z) / 1.6));
const rnd = (n: number) => { const x = Math.sin(n * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
const noRaycast = () => {};

export function FishingPier() {
  const g = useMemo(() => {
    const g = new Group(), o = new Object3D();
    const wood = applyPbr(new MeshStandardMaterial({ color: '#c2ad92' }), 'brown_planks_05', { repeat: [.35, .2] });
    const post = applyPbr(new MeshStandardMaterial({ color: '#8d7a66' }), 'bark_brown_02', { repeat: [.5, 1.5] });
    const algae = new MeshStandardMaterial({ color: '#3d4a33', roughness: .8 });
    const add = (m: Mesh | InstancedMesh) => { m.castShadow = m.receiveShadow = true; m.raycast = noRaycast; g.add(m); return m; };

    // Deck boards, each a little different in tone, height and angle.
    const n = Math.floor((Z0 - Z1) / .23), boards = new InstancedMesh(new BoxGeometry(W, .05, .2), wood, n);
    const tones = ['#ffffff', '#e6dccd', '#d2c6b4', '#f1e9de', '#c7b9a5'].map(c => new Color(c));
    let k = 0;
    for (let i = 0; i < n; i++) {
      if (i === 23 || i === 41) continue; // missing boards
      const z = Z0 - .1 - i * .23;
      o.position.set(X + (rnd(i) - .5) * .05, deckY(z) + (rnd(i + 7) - .5) * .012, z);
      o.rotation.set((Z0 - z < 1.6 ? .21 : 0) + (rnd(i + 3) - .5) * .02, (rnd(i + 5) - .5) * .03, (rnd(i + 9) - .5) * .02);
      o.scale.set(1 - rnd(i + 11) * .08, 1, 1); o.updateMatrix();
      boards.setMatrixAt(k, o.matrix); boards.setColorAt(k, tones[i % 5]); k++;
    }
    boards.count = k; add(boards);

    // Two stringers under the boards.
    for (const sx of [-1, 1]) {
      const len = Z0 - Z1 - 1.4, s = new Mesh(new BoxGeometry(.12, .16, len), wood);
      s.position.set(X + sx * (W / 2 - .2), DECK - .11, (Z0 - 1.4 + Z1) / 2); add(s);
    }

    // Pilings in pairs every bay; the outer ones rise above the deck for tying up.
    const bays = Math.floor((Z0 - 1.4 - Z1) / BAY) + 1, ties: Vector3[] = [];
    for (let b = 0; b < bays; b++) {
      const z = Z0 - 1.4 - b * BAY;
      for (const sx of [-1, 1]) {
        const tall = b % 2 === 0, top = DECK + (tall ? .55 : -.06), bottom = -1.6, h = top - bottom, x = X + sx * (W / 2 + .02);
        const p = new Mesh(new CylinderGeometry(.085, .1, h, 10), post); p.position.set(x, bottom + h / 2, z); p.rotation.z = (rnd(b * 2 + sx) - .5) * .05; add(p);
        const a = new Mesh(new CylinderGeometry(.103, .106, .55, 10), algae); a.position.set(x, -.42, z); add(a);
        if (tall && sx < 0) ties.push(new Vector3(x, top - .12, z));
        // Old tire fender on the side where the boats come alongside.
        if (sx > 0 && b % 2 === 1) { const t = new Mesh(new TorusGeometry(.24, .09, 8, 16), new MeshStandardMaterial({ color: '#1e1f20', roughness: .9 })); t.position.set(x + .1, .02, z); t.rotation.y = Math.PI / 2; add(t); }
      }
      // Cross bracing between each pair.
      const brace = new Mesh(new BoxGeometry(Math.hypot(W, .7), .08, .05), wood);
      brace.position.set(X, DECK - .5, z); brace.rotation.z = Math.atan2(.7, W) * (b % 2 ? 1 : -1); add(brace);
    }
    // Rope sagging between the tall pilings on the west side.
    for (let i = 0; i < ties.length - 1; i++) {
      const a = ties[i], b = ties[i + 1], mid = a.clone().lerp(b, .5); mid.y -= .28;
      const rope = new Mesh(new TubeGeometry(new CatmullRomCurve3([a, a.clone().lerp(mid, .55).setY(mid.y + .1), mid, b.clone().lerp(mid, .55).setY(mid.y + .1), b]), 24, .018, 5), new MeshStandardMaterial({ color: '#b39b72', roughness: .9 }));
      add(rope);
    }
    return g;
  }, []);
  return <>
    <primitive object={g} />
    <Model id="plastic_crate_02" position={[X + .35, DECK + .03, Z1 + .9]} rotation={.3} tint="#2f6fb0" />
  </>;
}
