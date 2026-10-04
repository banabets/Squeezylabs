import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Preload } from '@react-three/drei';
import { memo, Suspense, useRef } from 'react';
import { PCFSoftShadowMap, ACESFilmicToneMapping, Vector3, type DirectionalLight, type HemisphereLight } from 'three';
import { useMaterials } from '../scene/Materials';
import { ClearWater } from '../scene/Water';
import { Grounding } from '../scene/Grounding';
import { Atmosphere } from '../scene/Atmosphere';
import { CameraRig } from './CameraRig';
import { Island, Peneros, ShoreBoulders } from '../scene/Coast';
import { TropicalGarden } from '../scene/Vegetation';
import { CoastalEntrance, GamesArea, WebAppsArea, ExperimentLab, StudioDetails } from '../scene/Architecture';
import { Bodega, Pueblo } from '../scene/Bodega';
import { BeachDetails } from '../scene/Extras';
import { FishingPier } from '../scene/Pier';
import { Fireflies, Lighthouse, NightLights } from '../scene/Night';
import { FishingSpot } from '../scene/Fishing';
import { RealBirds } from '../scene/RealBirds';
import { Atarraya, BeachToldo, Chinchorro, Papagayos, RaspadoCart, VillageSigns } from '../scene/Venezuela';
import { FoliageLod } from '../scene/FoliageLod';
import { windUniform } from '../scene/wind';
import { applyDaylight, sky } from '../scene/daylight';
import { journey } from '../data/journey';
import { PerformanceProbe } from './PerformanceProbe';
import { RenderBudget } from './RenderBudget';
import { Effects } from './Effects';
import { Festoons, Motes } from '../scene/Festoon';
import { Props } from '../scene/Props';
import { PowerLines } from '../scene/PowerLines';

// Warm sunset glow is a CSS layer over the canvas: it costs nothing on the GPU and follows sky.warmth.
const glow={el:null as HTMLDivElement|null};
function GlowDriver(){useFrame(()=>{if(glow.el)glow.el.style.opacity=String(sky.warmth.value);});return null;}
function WindClock(){useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)windUniform.value+=Math.min(dt,.05);});return null;}
// Sun, sky light, background and fog follow the scroll: morning on arrival to sunset on the horizon.
const focus=new Vector3();
function Daylight(){
 const sun=useRef<DirectionalLight>(null),hemi=useRef<HemisphereLight>(null),scene=useThree(s=>s.scene);
 useFrame(({camera})=>{if(!sun.current||!hemi.current)return;applyDaylight(journey.rendered,sun.current,hemi.current,scene);
  // Fit the shadow map to what the camera sees: centered a little ahead of it, wider when it flies high.
  const s=sun.current,ahead=camera.getWorldDirection(focus).multiplyScalar(10).add(camera.position);ahead.y=0;
  s.position.add(ahead);s.target.position.copy(ahead);s.target.updateMatrixWorld();
  const half=Math.min(42,Math.max(14,camera.position.y*1.1+10)),sc=s.shadow.camera;
  if(Math.abs(sc.right-half)>.5){sc.left=sc.bottom=-half;sc.right=sc.top=half;sc.updateProjectionMatrix();}
 });
 return <><hemisphereLight ref={hemi} args={['#cfe3f2','#c9b896',.72]}/>
 <directionalLight ref={sun} position={[24,16,18]} intensity={3.1} color="#ffe2bd" castShadow shadow-mapSize={[4096,4096]} shadow-camera-left={-36} shadow-camera-right={36} shadow-camera-top={36} shadow-camera-bottom={-36} shadow-camera-near={1} shadow-camera-far={120} shadow-bias={-.0003} shadow-normalBias={.025}/></>;
}
export const Experience=memo(function Experience({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){
 return <div className="world" aria-label="Interactive Caribbean world"><Canvas shadows={{type:PCFSoftShadowMap}} dpr={[1,1.5]} camera={{position:[0,3.2,16],fov:53,near:.12,far:900}} gl={{antialias:false,stencil:false,powerPreference:'high-performance',toneMapping:ACESFilmicToneMapping,toneMappingExposure:1.05}} fallback={<div className="fallback">This world needs WebGL. Try a browser with hardware acceleration enabled.</div>}>
 <color attach="background" args={['#cfe6ea']}/><fog attach="fog" args={['#cfe6ea',80,320]}/>
 <Atmosphere/><NightLights/>
 <Daylight/>
 <WindClock/><GlowDriver/>
 <PerformanceProbe/>
 <RenderBudget/>
 <Suspense fallback={null}><Environment files="/materials/coastal-light.hdr" environmentIntensity={.45}/><World onSelect={onSelect} onReady={onReady}/>{/* Compile every shader and upload every texture during the loader, not on first sight mid-scroll. */}<Preload all/></Suspense>
 <Effects/>
 </Canvas><div className="sunset-glow" ref={el=>{glow.el=el;}} aria-hidden="true"/></div>;
});
function World({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){useMaterials();return <><ClearWater/><Island/><Grounding/><TropicalGarden/><CoastalEntrance/><Festoons/><Motes/><GamesArea onSelect={()=>onSelect('games')}/><WebAppsArea onSelect={()=>onSelect('web')}/><ExperimentLab onSelect={()=>onSelect('experiments')}/><StudioDetails/><Peneros/><Pueblo/><Bodega onSelect={onSelect}/><Props/><PowerLines/><BeachDetails/><RealBirds/><Chinchorro/><RaspadoCart/><Papagayos/><BeachToldo/><Atarraya/><VillageSigns/><ShoreBoulders/><Lighthouse/><Fireflies/><FishingPier/><FishingSpot/><CameraRig onReady={onReady}/><FoliageLod/></>;}



