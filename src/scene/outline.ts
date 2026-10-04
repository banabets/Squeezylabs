import { BackSide, BufferGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, type Object3D } from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Ink outline by the inverted-hull method: a back-face copy pushed out along smooth normals.
// One shared material; width is in object units at 25 m and scales with distance.
export const outlineWidth = { value: .03 };
export const outlinesEnabled = false;
export const outlineMaterial = new MeshBasicMaterial({ color: '#2b2230', side: BackSide });
outlineMaterial.onBeforeCompile = shader => {
  shader.uniforms.uOutline = outlineWidth;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uOutline;')
    // Thinner up close, thicker far away, so the ink line keeps a similar on-screen weight.
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat inkDist = length((modelViewMatrix * vec4(position, 1.0)).xyz);\ntransformed += normalize(normal) * uOutline * clamp(inkDist / 25.0, .2, 1.6);');
};
outlineMaterial.customProgramCacheKey = () => 'ink-outline-v2';

/** Welds a geometry by position and gives it smooth normals, so the pushed-out hull has no gaps. */
export function hullGeometry(source: BufferGeometry) {
  const g = new BufferGeometry();
  g.setAttribute('position', source.attributes.position.clone());
  if (source.index) g.setIndex(source.index.clone());
  const welded = mergeVertices(g, 1e-3);
  welded.computeVertexNormals();
  return welded;
}

export function outlineMesh(geometry: BufferGeometry) {
  const m = new Mesh(geometry, outlineMaterial);
  m.raycast = () => {};
  return m;
}

/** Adds one merged outline hull for every opaque, non-instanced mesh under `root` (e.g. a batched house). */
export function addOutline(root: Object3D) {
  // Ink outlines belonged to the diorama look; the realistic pass keeps scenery unlined.
  if (!outlinesEnabled) return root;
  root.updateMatrixWorld(true);
  const inverse = new Matrix4().copy(root.matrixWorld).invert(), parts: BufferGeometry[] = [];
  root.traverse(o => {
    if (!(o instanceof Mesh) || o instanceof InstancedMesh || o.material === outlineMaterial) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.some(m => m.transparent)) return;
    const g = new BufferGeometry();
    g.setAttribute('position', o.geometry.attributes.position.clone());
    if (o.geometry.index) g.setIndex(o.geometry.index.clone());
    parts.push((g.index ? g.toNonIndexed() : g).applyMatrix4(new Matrix4().multiplyMatrices(inverse, o.matrixWorld)));
  });
  if (!parts.length) return root;
  const merged = mergeGeometries(parts);
  parts.forEach(p => p.dispose());
  if (merged) root.add(outlineMesh(hullGeometry(merged)));
  return root;
}
