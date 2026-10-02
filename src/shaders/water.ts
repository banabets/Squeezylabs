export const waterVertex = `
uniform float uTime;
varying vec3 vWorld;
void main() {
 vec3 p = position;
 p.z += sin(p.x*.65+uTime*.65)*.045 + sin(p.y*.8+uTime*.5)*.035;
 vec4 world = modelMatrix * vec4(p,1.0);
 vWorld = world.xyz;
 gl_Position = projectionMatrix * viewMatrix * world;
}`;
export const waterFragment = `
uniform float uTime;
varying vec3 vWorld;
float wave(vec2 p) { return sin(p.x*2.8+sin(p.y*3.2+uTime*.32))*sin(p.y*3.4+sin(p.x*2.1-uTime*.28)); }
void main() {
 vec2 p = vWorld.xz;
 float depth = 1.-smoothstep(-65.,-6.,p.y);
 vec3 color = mix(vec3(.015,.52,.39), vec3(.008,.15,.25),depth);
 float w = wave(p*.82+uTime*.035);
 float caustic = pow(1.-abs(w),18.);
 color += caustic*.12*(1.-depth);
 float ripples=sin(p.x*1.2+p.y*2.8+sin(p.x*.6+uTime*.6)+uTime*.9);
 color += pow(max(0.,ripples),24.)*.11;
 vec3 viewDir=normalize(cameraPosition-vWorld);
 float fresnel=pow(1.-max(viewDir.y,0.),3.);
 color=mix(color,vec3(.16,.49,.57),fresnel*.32);
 float glint=pow(max(0.,sin(p.x*7.+p.y*5.+uTime)*sin(p.y*9.-uTime*.7)),35.);
 color += glint*.27;
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
