import type { Material } from 'three';

// One clock for every wind-driven material; WindClock advances it unless motion is paused.
export const windUniform = { value: 0 };

// Sways vertices in the vertex shader. Sway grows with height above `base`; `flutter` adds a fast per-leaf shiver.
// Apply the same call to a shadow depth material so shadows move with the leaves.
export function addWind<T extends Material>(mat: T, { base = 1.8, amp = .05, flutter = 0 } = {}): T {
  mat.onBeforeCompile = shader => {
    shader.uniforms.uTime = windUniform;
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
      #endif
      vec3 wp = (modelMatrix * mvPosition).xyz;
      float hgt = max(wp.y - ${base.toFixed(2)}, 0.);
      float sw = sin(uTime * 1.3 + wp.x * .5 + wp.z * .4) * .6 + sin(uTime * 2.3 + wp.y * .8) * .25;
      float fl = sin(uTime * 7. + wp.x * 13. + wp.z * 9. + wp.y * 11.) * ${flutter.toFixed(3)};
      mvPosition.xyz += vec3(sw * ${amp.toFixed(3)} * hgt + fl, fl * .6, cos(uTime * 1.1 + wp.x * .7) * ${amp.toFixed(3)} * .7 * hgt + fl);
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
  };
  mat.customProgramCacheKey = () => `wind${base}/${amp}/${flutter}`;
  return mat;
}
