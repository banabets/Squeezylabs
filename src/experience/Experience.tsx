import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
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
import { BeachDetails, CloudBank, Mangroves, Pelican } from '../scene/Extras';
import { Birds } from '../scene/Gulls';
import { Visitor } from '../scene/Visitor';
import { FoliageLod } from '../scene/FoliageLod';
import { windUniform } from '../scene/wind';
import { applyDaylight } from '../scene/daylight';
import { journey } from '../data/journey';
import { PerformanceProbe } from './PerformanceProbe';
import { RenderBudget } from './RenderBudget';

function WindClock(){useFrame((_,dt)=>{if(!journey.paused&&!journey.reduced)windUniform.value+=Math.min(dt,.05);});return null;}
// Sun, sky light, background and fog follow the scroll: morning on arrival to sunset on the horizon.
function Daylight(){
 const sun=useRef<DirectionalLight>(null),hemi=useRef<HemisphereLight>(null),scene=useThree(s=>s.scene);
 useFrame(()=>{if(sun.current&&hemi.current)applyDaylight(journey.rendered,sun.current,hemi.current,scene);});
 return <><hemisphereLight ref={hemi} args={['#cfe3f2','#c9b896',.72]}/>
 <directionalLight ref={sun} position={[24,16,18]} intensity={3.1} color="#ffe2bd" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-36} shadow-camera-right={36} shadow-camera-top={36} shadow-camera-bottom={-36} shadow-camera-near={1} shadow-camera-far={120} shadow-bias={-.0003} shadow-normalBias={.025}/></>;
}
export const Experience=memo(function Experience({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){
 return <div className="world" aria-label="Interactive Caribbean world"><Canvas shadows={{type:PCFSoftShadowMap}} dpr={[1,1.5]} camera={{position:[0,3.2,16],fov:53,near:.12,far:900}} gl={{antialias:true,powerPreference:'high-performance',toneMapping:ACESFilmicToneMapping,toneMappingExposure:.95}} fallback={<div className="fallback">This world needs WebGL. Try a browser with hardware acceleration enabled.</div>}>
 <color attach="background" args={['#cfe6ea']}/><fog attach="fog" args={['#cfe6ea',80,320]}/>
 <Atmosphere/><CloudBank/>
 <Daylight/>
 <WindClock/>
 <PerformanceProbe/>
 <RenderBudget/>
 <Suspense fallback={null}><Environment files="/materials/coastal-light.hdr" environmentIntensity={.32}/><World onSelect={onSelect} onReady={onReady}/></Suspense>
 </Canvas></div>;
});
function World({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){useMaterials();return <><ClearWater/><Island/><Grounding/><TropicalGarden/><CoastalEntrance/><GamesArea onSelect={()=>onSelect('games')}/><WebAppsArea onSelect={()=>onSelect('web')}/><ExperimentLab onSelect={()=>onSelect('experiments')}/><StudioDetails/><Peneros/><Pueblo/><Bodega onSelect={onSelect}/><Mangroves/><BeachDetails/><Birds/><Visitor onSelect={()=>onSelect('about')}/><Pelican position={[-2,.72,-13]}/><CameraRig onReady={onReady}/><FoliageLod/></>;}



