import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, BufferAttribute, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { journey } from '../data/journey';
import { trunk } from './Mango';
import { simulationVisible } from './visibility';

const STEP = 1 / 60;
const noRaycast = () => {};

// Verlet cloth hung from four clothespins. Wind pushes each triangle along its normal, so the towel billows and flaps.
export function createCloth({ cx, cz, topY, w, h, color, nx = 14, ny = 18 }: { cx: number; cz: number; topY: number; w: number; h: number; color: string; nx?: number; ny?: number }) {
  const N = nx * ny, pos = new Float32Array(N * 3), prev = new Float32Array(N * 3), force = new Float32Array(N * 3), pinned = new Uint8Array(N);
  const cons: number[] = [], idx: number[] = [], uv: number[] = [];
  const pins = [0, Math.round((nx - 1) / 3), Math.round(2 * (nx - 1) / 3), nx - 1];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    pos[k * 3] = cx - w / 2 + i * w / (nx - 1); pos[k * 3 + 1] = topY - j * h / (ny - 1); pos[k * 3 + 2] = cz + Math.sin(i * 1.3 + j) * .004;
    uv.push(i / (nx - 1), 1 - j / (ny - 1));
    if (j === 0 && pins.includes(i)) pinned[k] = 1;
  }
  prev.set(pos);
  const link = (a: number, b: number) => cons.push(a, b, Math.hypot(pos[a * 3] - pos[b * 3], pos[a * 3 + 1] - pos[b * 3 + 1], pos[a * 3 + 2] - pos[b * 3 + 2]));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (i < nx - 1) link(k, k + 1);
    if (j < ny - 1) link(k, k + nx);
    if (i < nx - 1 && j < ny - 1) { link(k, k + nx + 1); link(k + 1, k + nx); idx.push(k, k + nx, k + 1, k + 1, k + nx, k + nx + 1); }
  }
  const geometry = new BufferGeometry(), attr = new BufferAttribute(pos, 3);
  geometry.setAttribute('position', attr); geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2)); geometry.setIndex(idx); geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, new MeshStandardMaterial({ color, roughness: .92, side: DoubleSide }));
  mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.raycast = noRaycast;
  const pinTops = pins.map(i => [pos[i * 3], topY, cz]);

  function step(t: number, wind: number) {
    force.fill(0);
    for (let f = 0; f < idx.length; f += 3) {
      const a = idx[f] * 3, b = idx[f + 1] * 3, c = idx[f + 2] * 3;
      const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2], e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
      let nxv = e1y * e2z - e1z * e2y, nyv = e1z * e2x - e1x * e2z, nzv = e1x * e2y - e1y * e2x;
      const ln = Math.hypot(nxv, nyv, nzv) || 1e-6; nxv /= ln; nyv /= ln; nzv /= ln;
      const px = (pos[a] + pos[b] + pos[c]) / 3, py = (pos[a + 1] + pos[b + 1] + pos[c + 1]) / 3;
      const gust = wind * (.75 + .25 * Math.sin(t * .7) + .35 * Math.sin(t * 1.9 + px * 1.3) + .22 * Math.sin(t * 4.3 + py * 3.1 + px));
      const dot = (nxv * .3 * Math.sin(t * .5) * gust + nyv * .05 * gust + nzv * gust) * .33;
      for (let q = 0; q < 3; q++) { const v = idx[f + q] * 3; force[v] += nxv * dot; force[v + 1] += nyv * dot; force[v + 2] += nzv * dot; }
    }
    for (let k = 0; k < N; k++) {
      if (pinned[k]) continue;
      for (let ax = 0; ax < 3; ax++) { const o = k * 3 + ax, p = pos[o], vel = (p - prev[o]) * .985; prev[o] = p; pos[o] = p + vel + (force[o] + (ax === 1 ? -9.8 : 0)) * STEP * STEP; }
    }
    for (let it = 0; it < 8; it++) for (let m = 0; m < cons.length; m += 3) {
      const pa = pinned[cons[m]], pb = pinned[cons[m + 1]];
      if (pa && pb) continue;
      const A = cons[m] * 3, B = cons[m + 1] * 3, dx = pos[B] - pos[A], dy = pos[B + 1] - pos[A + 1], dz = pos[B + 2] - pos[A + 2];
      const dl = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, df = (dl - cons[m + 2]) / dl, wa = pa ? 0 : pb ? 1 : .5, wb = pb ? 0 : pa ? 1 : .5;
      pos[A] += dx * df * wa; pos[A + 1] += dy * df * wa; pos[A + 2] += dz * df * wa;
      pos[B] -= dx * df * wb; pos[B + 1] -= dy * df * wb; pos[B + 2] -= dz * df * wb;
    }
  }
  function sync() { attr.needsUpdate = true; geometry.computeVertexNormals(); }
  return { mesh, pinTops, step, sync };
}

// Several towels sharing a fixed-step clock, so the sim behaves the same at any frame rate.
export function createClothSet(cloths: ReturnType<typeof createCloth>[], wind: number) {
  let t = 0, acc = 0;
  for (let i = 0; i < 90; i++) { t += STEP; cloths.forEach(c => c.step(t, wind)); }
  cloths.forEach(c => c.sync());
  return (dt: number) => {
    acc += dt; let n = 0;
    while (acc >= STEP && n < 3) { t += STEP; cloths.forEach(c => c.step(t, wind)); acc -= STEP; n++; }
    if (n === 3) acc = 0;
    if(n>0)cloths.forEach(c => c.sync());
  };
}

const pinMat = new MeshStandardMaterial({ color: '#c9a56f', roughness: .8 });
const pinGeo = new BoxGeometry(.03, .09, .04);

// A clothesline along x between two posts, with towels in a strong wind ("ventarrón").
export function Clothesline({ x0, x1, z, colors, height = 2.2, wind = 8 }: { x0: number; x1: number; z: number; colors: string[]; height?: number; wind?: number }) {
  const { group, advance } = useMemo(() => {
    const group = new Group(), wood = new MeshStandardMaterial({ color: '#9a7a55', roughness: .85 });
    group.add(trunk([x0, 0, z], [x0, height + .14, z], .05, .045, wood), trunk([x1, 0, z], [x1, height + .14, z], .05, .045, wood));
    group.add(trunk([x0, height, z], [x1, height, z], .008, .008, new MeshStandardMaterial({ color: '#ddd6c6', roughness: .8 })));
    const gap = .15, w = (x1 - x0 - gap * (colors.length + 1)) / colors.length;
    const cloths = colors.map((color, i) => createCloth({ cx: x0 + gap + w / 2 + i * (w + gap), cz: z, topY: height - .02, w, h: w * 1.25, color }));
    for (const c of cloths) {
      group.add(c.mesh);
      for (const p of c.pinTops) { const pin = new Mesh(pinGeo, pinMat); pin.position.set(p[0], p[1] + .01, p[2] + .02); pin.castShadow = true; group.add(pin); }
    }
    return { group, advance: createClothSet(cloths, wind) };
  }, [x0, x1, z, height, wind, colors.join()]);
  const center=useMemo(()=>new Vector3((x0+x1)/2,height/2,z),[x0,x1,height,z]);
  useFrame(({camera}, dt) => { if (!journey.paused && !journey.reduced && simulationVisible(camera,center,3)) advance(Math.min(dt, .05)); });
  return <primitive object={group} />;
}

