import { CanvasTexture, ExtrudeGeometry, MeshStandardMaterial, SRGBColorSpace, Shape } from 'three';
import { applyPbr } from './realism';
import { RoundedBox } from '@react-three/drei';
import { Box } from './Primitives';
import { flat, PALETTE } from './flat';
import { ArcadeScreen, ProjectScreen } from './Screens';
import { Shrub } from './Vegetation';
import { ColonialHouse } from './Colonial';
import { Clothesline } from './Cloth';
import { trunk } from './Mango';
const vineStem=new MeshStandardMaterial({color:'#5b4632',roughness:.9});
type V=[number,number,number];
function Shutter({position,color='#5b9d94'}:{position:V;color?:string}){return <group position={position}><Box size={[1.05,1.45,.09]} color={color}/>{Array.from({length:10},(_,i)=><Box key={i} position={[0,-.62+i*.14,.07]} size={[.95,.065,.1]} rotation={[.2,0,0]} color={color}/>)}<Box position={[0,0,.12]} size={[.055,1.5,.04]} color="#315b54"/></group>;}
// Studio cottages in the coastal colonial style, with an open portico so the arcade and desk stay visible.
function Cottage({position,color,width=5,depth=4,zocalo='#2f6f9e',bougainvillea=false}:{position:V;color:string;width?:number;depth?:number;zocalo?:string;bougainvillea?:boolean}){return <group position={position}>
 <ColonialHouse position={[0,0,depth/2]} width={width} depth={depth} wall={color} zocalo={zocalo} portico bougainvillea={bougainvillea} seed={Math.round(width*10)}/>
 <mesh position={[0,.32,.2]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[width*.7,depth*.62]}/><meshStandardMaterial color="#c9a678" roughness={.85}/></mesh>
 </group>;}
function Chair({position,rotation=0}:{position:V;rotation?:number}){return <group position={position} rotation={[0,rotation,0]}>{[-1,1].map(s=>[-1,1].map(z=><Box key={`${s}${z}`} position={[s*.3,.4,z*.29]} size={[.055,.8,.055]} color="#72543e"/>))}<Box position={[0,.76,0]} size={[.72,.08,.65]} color="#ab7c50"/>{[-1,1].map(s=><Box key={s} position={[s*.3,1.02,-.29]} size={[.05,.9,.06]} color="#72543e"/>)}{[0,1,2].map(i=><Box key={i} position={[0,1.06+i*.14,-.29]} size={[.65,.10,.04]} color="#ab7c50"/>)}</group>;}
export function StudioDetails(){return <>
 <Clothesline x0={10.3} x1={13.1} z={-3.7} colors={['#2e8d86','#c4dceb']}/>
 </>;}
function Pot({position,scale=1}:{position:V;scale?:number}){return <group position={position} scale={scale}><mesh position={[0,.35,0]} castShadow material={flat(PALETTE.terracotta)}><cylinderGeometry args={[.4,.26,.7,8]}/></mesh><Shrub position={[0,.6,0]} scale={.55} seed={7}/></group>;}
// Upright arcade cabinet with a real silhouette: the side profile is extruded, so the sides carry the
// side art while the edges get a dark T-molding look; lit marquee, sloped control panel and coin door.
const arcadeArt=(()=>{const c=document.createElement('canvas');c.width=256;c.height=512;const k=c.getContext('2d')!;
 const g=k.createLinearGradient(0,0,0,512);g.addColorStop(0,'#1d4f6e');g.addColorStop(1,'#123245');k.fillStyle=g;k.fillRect(0,0,256,512);
 for(let i=0;i<7;i++){k.strokeStyle=['#a8ed00','#f2b33d','#e2458a'][i%3];k.lineWidth=14;k.beginPath();k.moveTo(-40,330+i*26);k.quadraticCurveTo(128,250+i*26,300,300+i*26);k.stroke();}
 k.fillStyle='#a8ed00';k.font='italic 700 54px Georgia, serif';k.save();k.translate(150,170);k.rotate(-.35);k.fillText('Squeezy',-110,0);k.restore();
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;t.anisotropy=8;return t;})();
const marquee=(()=>{const c=document.createElement('canvas');c.width=512;c.height=128;const k=c.getContext('2d')!;k.fillStyle='#14212b';k.fillRect(0,0,512,128);
 k.fillStyle='#a8ed00';k.font='700 64px "DM Sans", Arial, sans-serif';k.textAlign='center';k.textBaseline='middle';k.fillText('SQUEEZY',256,58);k.fillStyle='#f2b33d';k.font='600 22px "DM Sans", Arial';k.fillText('A R C A D E',256,104);
 const t=new CanvasTexture(c);t.colorSpace=SRGBColorSpace;return t;})();
const cabinetGeo=(()=>{const sh=new Shape();[[-.42,0],[.42,0],[.42,.86],[.18,.99],[.06,1.62],[.17,1.66],[.17,1.88],[-.42,1.88]].forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));sh.closePath();
 const g=new ExtrudeGeometry(sh,{depth:.72,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2});g.translate(0,0,-.36);g.rotateY(-Math.PI/2);
 // Caps (the two sides) get UVs that fit the art once across the profile.
 // The +x side is seen from outside mirrored, so its u runs the other way to keep the lettering readable.
 const uv=g.attributes.uv,p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<uv.count;i++){const u=(p.getZ(i)+.42)/.84;uv.setXY(i,n.getX(i)>.5?1-u:u,p.getY(i)/1.88);}return g;})();
function Arcade({onSelect}:{onSelect:()=>void}){return <group position={[-7,.33,.3]} rotation={[0,.16,0]}>
 <mesh geometry={cabinetGeo} material={[new MeshStandardMaterial({map:arcadeArt,roughness:.45}),new MeshStandardMaterial({color:'#15181b',roughness:.35})]} castShadow receiveShadow/>
 <mesh position={[0,1.77,.192]}><planeGeometry args={[.66,.17]}/><meshStandardMaterial map={marquee} emissive="#ffffff" emissiveMap={marquee} emissiveIntensity={.9} toneMapped={false}/></mesh>
 <group position={[0,1.31,.146]} rotation={[-.19,0,0]}><mesh position={[0,0,-.005]}><planeGeometry args={[.66,.56]}/><meshStandardMaterial color="#0b0d0e" roughness={.2}/></mesh><ArcadeScreen size={[.54,.42]} position={[0,0,.002]} onSelect={onSelect}/></group>
 <group position={[0,.94,.316]} rotation={[-.49,0,0]}>
  <mesh><boxGeometry args={[.74,.02,.28]}/><meshStandardMaterial color="#1f3a4c" roughness={.5}/></mesh>
  <mesh position={[-.2,.06,0]}><cylinderGeometry args={[.012,.012,.11,8]}/><meshStandardMaterial color="#222"/></mesh>
  <mesh position={[-.2,.12,0]}><sphereGeometry args={[.035,16,12]}/><meshStandardMaterial color="#e2312f" roughness={.25}/></mesh>
  {[0,1,2].map(i=><mesh key={i} position={[.04+i*.1,.016,i%2?.03:-.02]}><cylinderGeometry args={[.028,.028,.025,20]}/><meshStandardMaterial color={['#f2b33d','#a8ed00','#2f8fd8'][i]} roughness={.3}/></mesh>)}
 </group>
 <mesh position={[0,.45,.438]}><boxGeometry args={[.32,.36,.01]}/><meshStandardMaterial color="#2b2f33" metalness={.6} roughness={.35}/></mesh>
 {[-.07,.07].map(x=><mesh key={x} position={[x,.52,.445]}><boxGeometry args={[.04,.07,.006]}/><meshStandardMaterial color="#f08a24" emissive="#f08a24" emissiveIntensity={.5}/></mesh>)}
 </group>;}
export function GamesArea({onSelect}:{onSelect:()=>void}){return <><Cottage position={[-7,0,-1]} color="#f4bf4f" zocalo="#2f6f9e" width={4.7} depth={4} bougainvillea/><Arcade onSelect={onSelect}/><Pot position={[-9.7,0,1.5]}/><Pot position={[-4.4,0,.3]} scale={1.2}/><Box position={[-7,.22,2]} size={[4.8,.16,.8]} color="#d0b995"/></>;}
const deskWood=applyPbr(new MeshStandardMaterial({color:'#e8d2b4'}),'brown_planks_05',{repeat:[1.2,.5]});
export function WebAppsArea({onSelect}:{onSelect:()=>void}){return <>
 <Cottage position={[6,0,-3]} color="#5fbfb4" zocalo="#d9644a" width={5.7} depth={4.2}/>
 <group position={[6,.4,-2.2]}>
 {/* Wooden desk with a slim monitor on a stand; laptop, lamp and chair are scanned props (Props.tsx). */}
 <RoundedBox args={[2.3,.05,.85]} radius={.012} smoothness={2} position={[0,.76,0]} material={deskWood} castShadow receiveShadow/>
 {[-1,1].map(sx=>[-1,1].map(sz=><Box key={`${sx}${sz}`} position={[sx*1.08,.37,sz*.36]} size={[.045,.74,.045]} color="#1d1f21"/>))}
 <Box position={[0,.68,-.36]} size={[2.1,.1,.02]} color="#1d1f21"/>
 <RoundedBox args={[1.12,.68,.035]} radius={.012} smoothness={2} position={[.15,1.28,-.22]} castShadow><meshStandardMaterial color="#17191b" roughness={.3}/></RoundedBox>
 <ProjectScreen size={[1.06,.6]} position={[.15,1.28,-.2]} cycle onSelect={onSelect}/>
 <mesh position={[.15,.95,-.26]}><cylinderGeometry args={[.025,.03,.36,12]}/><meshStandardMaterial color="#b9bcbf" metalness={.7} roughness={.3}/></mesh>
 <mesh position={[.15,.79,-.24]}><boxGeometry args={[.32,.012,.2]}/><meshStandardMaterial color="#b9bcbf" metalness={.7} roughness={.3}/></mesh>
 <group position={[-.75,.79,-.18]} rotation={[-.25,.3,0]}><RoundedBox args={[.2,.34,.012]} radius={.01} smoothness={2} position={[0,.17,0]}><meshStandardMaterial color="#17191b" roughness={.3}/></RoundedBox><ProjectScreen size={[.17,.3]} position={[0,.17,.008]} reel={2}/></group>
 </group><Pot position={[9.3,0,-.9]} scale={1.3}/>
 </>;}
export function CoastalEntrance(){return <>
 {[-1,1].map(side=><group key={side}><Box position={[side*2.1,1.8,3.6]} size={[.18,3.6,.18]} color="#857554"/><Box position={[side*2.1,1.8,-.4]} size={[.18,3.6,.18]} color="#857554"/></group>)}
 {[0,1,2,3,4,5,6,7,8].map(i=><Box key={i} position={[0,3.65,-.6+i*.55]} size={[4.65,.13,.17]} color="#99815c"/>)}
 <Box position={[-2.1,3.52,1.5]} size={[.13,.16,4.5]} color="#73634b"/><Box position={[2.1,3.52,1.5]} size={[.13,.16,4.5]} color="#73634b"/>
 {/* Bougainvillea planted at the pergola post, climbing it and spreading over the top beams. */}
 <mesh position={[-2.25,.2,-.25]} castShadow material={flat(PALETTE.terracotta)}><cylinderGeometry args={[.24,.18,.4,14]}/></mesh>
 <primitive object={trunk([-2.24,.35,-.25],[-2.2,1.8,-.3],.04,.03,vineStem,6)}/><primitive object={trunk([-2.2,1.8,-.3],[-2.24,3.55,-.28],.03,.025,vineStem,6)}/><primitive object={trunk([-2.24,3.55,-.28],[-2.2,3.66,.9],.025,.02,vineStem,6)}/>
 <Shrub position={[-2.2,3.55,1]} scale={1} seed={22} flowers/>
 </>;}
// The experiments chapter keeps the open view of the beach; only a potted plant marks the corner.
export function ExperimentLab(_:{onSelect:()=>void}){return <Pot position={[10.7,0,2.4]}/>;}

