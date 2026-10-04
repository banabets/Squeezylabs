import { useFrame } from '@react-three/fiber';
import { Bloom, BrightnessContrast, EffectComposer, HueSaturation, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useRef } from 'react';
import { sky } from '../scene/daylight';
import { LOW } from '../quality';

// Final image: contact shadows (N8AO) ground every object on the sand, bloom lets lamps, the mascot's
// rim and the sun on the water glow, then a light grade and vignette. Tone mapping moves here
// because the composer renders in linear HDR.
export function Effects() {
  const ao = useRef<{ configuration: { intensity: number } } | null>(null);
  // Ambient occlusion fades at night so dark scenes do not turn muddy.
  useFrame(() => { if (ao.current) ao.current.configuration.intensity = 2.6 * (1 - sky.night.value * .7); });
  if (LOW) return <EffectComposer multisampling={0} enableNormalPass={false}>
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    <BrightnessContrast brightness={-.03} contrast={.1} />
    <Vignette offset={.35} darkness={.32} />
  </EffectComposer>;
  return <EffectComposer multisampling={0} enableNormalPass={false}>
    <N8AO ref={ao as never} halfRes quality="performance" aoRadius={1.6} distanceFalloff={.6} intensity={2.6} color="#3b2a2a" />
    <Bloom mipmapBlur luminanceThreshold={.9} luminanceSmoothing={.25} intensity={.55} radius={.7} />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    <HueSaturation saturation={.05} />
    <BrightnessContrast brightness={-.03} contrast={.1} />
    <Vignette offset={.35} darkness={.32} />
    <SMAA />
  </EffectComposer>;
}
