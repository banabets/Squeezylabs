import { Canvas } from '@react-three/fiber';
import { Sky, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { useMaterials } from '../scene/Materials';
import { ReflectiveWater } from '../scene/Water';
import { Grounding } from '../scene/Grounding';
import { Atmosphere } from '../scene/Atmosphere';
import { PCFSoftShadowMap, ACESFilmicToneMapping } from 'three';
import { CameraRig } from './CameraRig';
import { Island, CaribbeanWater, Penero } from '../scene/Coast';
import { TropicalGarden } from '../scene/Vegetation';
import { CoastalEntrance, GamesArea, WebAppsArea, ExperimentLab, StudioDetails } from '../scene/Architecture';
export function Experience({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){
 return <div className="world" aria-label="Interactive Caribbean world"><Canvas shadows={{type:PCFSoftShadowMap}} dpr={[1,1.5]} camera={{position:[0,3.2,16],fov:53,near:.12,far:800}} gl={{antialias:true,powerPreference:'high-performance',toneMapping:ACESFilmicToneMapping,toneMappingExposure:1.15}} fallback={<div className="fallback">This world needs WebGL. Try a browser with hardware acceleration enabled.</div>}>
 <color attach="background" args={['#9ccbd3']}/><fog attach="fog" args={['#a5cbd0',70,300]}/>
 <Atmosphere/>
 <hemisphereLight args={['#c6e2ef','#c5b493',.65]}/>
 <directionalLight position={[-18,30,12]} intensity={3.5} color="#fff0d7" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={30} shadow-camera-bottom={-25} shadow-camera-near={1} shadow-camera-far={85} shadow-bias={-.0003} shadow-normalBias={.025}/>
 <Suspense fallback={null}><Environment files="/materials/coastal-light.hdr" environmentIntensity={.65}/><World onSelect={onSelect} onReady={onReady}/></Suspense>
 </Canvas></div>;
}
function World({onReady,onSelect}:{onReady:()=>void;onSelect:(name:string)=>void}){useMaterials();return <><ReflectiveWater/><Island/><Grounding/><TropicalGarden/><CoastalEntrance/><GamesArea onSelect={()=>onSelect('games')}/><WebAppsArea onSelect={()=>onSelect('web')}/><ExperimentLab onSelect={()=>onSelect('experiments')}/><StudioDetails/><Penero/><CameraRig onReady={onReady}/></>;}
