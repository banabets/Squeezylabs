import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace, Texture, Vector2 } from 'three';
export type Surface='sand'|'plaster'|'wood'|'bark';
export const surfaces:Partial<Record<Surface,{map:Texture;normalMap:Texture;roughnessMap:Texture;normalScale:Vector2}>>={};
const paths=['coast_sand_01','white_plaster_02','weathered_brown_planks','palm_tree_bark'].flatMap(id=>['Diffuse','nor_gl','Rough'].map(c=>`/materials/${id}_${c}.jpg`));
export function useMaterials(){const textures=useTexture(paths);useMemo(()=>{(['sand','plaster','wood','bark'] as Surface[]).forEach((key,i)=>{const [map,normalMap,roughnessMap]=textures.slice(i*3,i*3+3);for(const t of [map,normalMap,roughnessMap]){t.wrapS=t.wrapT=RepeatWrapping;t.anisotropy=8;}map.colorSpace=SRGBColorSpace;surfaces[key]={map,normalMap,roughnessMap,normalScale:new Vector2(key==='bark'?.85:key==='sand'?.38:.65,key==='bark'?.85:key==='sand'?.38:.65)};});},[textures]);}
