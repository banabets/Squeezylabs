import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Preload } from '@react-three/drei';
import { memo, Suspense, useRef } from 'react';
import { PCFSoftShadowMap, ACESFilmicToneMapping, type DirectionalLight, type HemisphereLight } from 'three';
import { useMaterials } from '../scene/Materials';
import { ClearWater } from '../scene/Water';
import { Grounding } from '../scene/Grounding';
import { Atmosphere } from '../scene/Atmosphere';
import { CameraRig } from './CameraRig';
import { Island, Peneros } from '../scene/Coast';
import { TropicalGarden } from '../scene/Vegetation';
import { CoastalEntrance, GamesArea, WebAppsArea, ExperimentLab, StudioDetails } from '../scene/Architecture';
import { Bodega, Pueblo } from '../scene/Bodega';
import { BeachDetails, Mangroves, Pelican } from '../scene/Extras';
import { LowPolyClouds } from '../scene/Weather';
import { Fireflies, Lighthouse, NightLights } from '../scene/Night';
import { SandTitle } from '../scene/SandTitle';
import { FishingSpot } from '../scene/Fishing';
import { Birds, Macaws } from '../scene/Gulls';
import { Visitor } from '../scene/Visitor';
import { FoliageLod } from '../scene/FoliageLod';
import { windUniform } from '../scene/wind';
import { applyDaylight, sky } from '../scene/daylight';
import { journey } from '../data/journey';
import { PerformanceProbe } from './PerformanceProbe';
import { RenderBudget } from './RenderBudget';

// Warm sunset glow is a CSS layer over the canvas: it costs nothing on the GPU and follows sky.warmth.
const glow={el:null as HTMLDivElement|null};
function GlowDriver(){useFrame(()=>{if(glow.el)glow.el.style.opacity=String(sky.warmth.value);});return null;}
function WindClock(){useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)windUniform.value+=Math.min(dt,.05);});return null;}
// Sun, sky light, background and fog follow the scroll: morning on arrival to sunset on the horizon.
function Daylight(){
 const sun=useRef<DirectionalLight>(null),hemi=useRef<HemisphereLight>(null),scene=useThree(s=>s.scene);
 useFrame(()=>{if(sun.current&&hemi.current)applyDaylight(journey.rendered,sun.current,hemi.current,scene);});
 return <><hemisphereLight ref={hemi} args={['#cfe3f2','#c9b896',.72]}/>
 <directionalLight ref={sun} position={[24,16,18]} intensity={3.1} color="#ffe2bd" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-36} shadow-camera-right={36} shadow-camera-top={36} shadow-camera-bottom={-36} shadow-camera-near={1} shadow-camera-far={120} shadow-bias={-.0003} shadow-normalBias={.025}/></>;
}
export const Experience=memo(function Experience({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){
 return <div className="world" aria-label="Interactive Caribbean world"><Canvas shadows={{type:PCFSoftShadowMap}} dpr={[1,1.5]} camera={{position:[0,3.2,16],fov:53,near:.12,far:900}} gl={{antialias:true,powerPreference:'high-performance',toneMapping:ACESFilmicToneMapping,toneMappingExposure:1.05}} fallback={<div className="fallback">This world needs WebGL. Try a browser with hardware acceleration enabled.</div>}>
 <color attach="background" args={['#cfe6ea']}/><fog attach="fog" args={['#cfe6ea',80,320]}/>
 <Atmosphere/><LowPolyClouds/><NightLights/>
 <Daylight/>
 <WindClock/><GlowDriver/>
 <PerformanceProbe/>
 <RenderBudget/>
 <Suspense fallback={null}><Environment files="/materials/coastal-light.hdr" environmentIntensity={.45}/><World onSelect={onSelect} onReady={onReady}/>{/* Compile every shader and upload every texture during the loader, not on first sight mid-scroll. */}<Preload all/></Suspense>
 </Canvas><div className="sunset-glow" ref={el=>{glow.el=el;}} aria-hidden="true"/></div>;
});
function World({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){useMaterials();return <><ClearWater/><Island/><Grounding/><TropicalGarden/><CoastalEntrance/><GamesArea onSelect={()=>onSelect('games')}/><WebAppsArea onSelect={()=>onSelect('web')}/><ExperimentLab onSelect={()=>onSelect('experiments')}/><StudioDetails/><Peneros/><Pueblo/><Bodega onSelect={onSelect}/><Mangroves/><BeachDetails/><Birds/><Macaws/><Visitor onSelect={()=>onSelect('about')}/><Pelican position={[-2,.72,-13]}/><Lighthouse/><Fireflies/><SandTitle/><FishingSpot/><CameraRig onReady={onReady}/><FoliageLod/></>;}



