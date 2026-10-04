// Realistic Caribbean water: gentle swell in the vertex shader, a smooth wind-sea normal with fine ripples,
// Fresnel sky reflection, sun glitter, soft caustics and lacy foam, over the island's seabed layout.
// Original notes: visible seabed with refraction, depth absorption,
// caustics, sandbars, a reef with breaking waves, starfish, cloud shadows, shoreline foam and the
// peñeros' shadows on the bottom. Colors are display-space and fogged by hand, so the material skips
// tone mapping and color-space chunks.
export const waterVertex = /* glsl */`
uniform float uTime;
uniform vec4 uMain;
uniform vec4 uCays[4];
varying vec3 vWorld;
float mainEdgeV(vec2 p){vec2 q=vec2(p.x/(p.x<0.?uMain.x:uMain.y),(p.y-8.)/(p.y<8.?uMain.z:uMain.w));float a=atan(q.y,q.x);return length(q)/(1.+sin(a*3.+.4)*.04+sin(a*7.)*.023);}
float cayEdgeV(vec2 p,vec4 c,float s){vec2 q=(p-c.xy)/c.zw;float a=atan(q.y,q.x);return length(q)/(1.+sin(a*3.+s)*.05+sin(a*5.+s*2.)*.03);}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec2 p = w.xz;
  float d=(mainEdgeV(p)-.94)*24.;
  for(int i=0;i<4;i++){vec4 c=uCays[i];d=min(d,(cayEdgeV(p,c,float(i)*1.7)-.94)*min(c.z,c.w)*1.3);}
  // Low-poly swell: a few long sine trains, calmer on the shallows so the shoreline stays readable.
  float amp=.08*smoothstep(-.5,3.,d)+.02;
  w.y += (sin(p.x*.42+uTime*1.05)+sin(p.y*.55-uTime*.85)+.6*sin((p.x-p.y)*.9+uTime*1.6))*amp*.4;
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const waterFragment = /* glsl */`
uniform float uTime;
uniform float uNight;
uniform vec3 uSun;
uniform vec3 uFog;
uniform vec3 uSkyRef;
uniform vec3 uSkyTop;
uniform vec3 uSunCol;
uniform vec2 uFogRange;
uniform vec4 uMain;      // west, east, north, south radii; center (0, 8)
uniform vec4 uCays[4];   // x, z, rx, rz
uniform vec4 uBars[2];   // x1, z1, x2, z2
uniform vec4 uBoats[4];  // x, z, yaw, unused
varying vec3 vWorld;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v*1.107;}
float caustic(vec2 uv,float time){
  vec2 p=mod(uv*6.28318,6.28318)-250.;vec2 i=p;float c=1.;float inten=.005;
  for(int n=0;n<5;n++){float t=time*(1.-(3.5/float(n+1)));i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));c+=1./length(vec2(p.x/(sin(i.x+t)/inten),p.y/(cos(i.y+t)/inten)));}
  c/=5.;c=1.17-pow(c,1.4);return pow(abs(c),8.);
}
vec3 sandCol(vec2 p){float g=fbm(p*.9);return mix(vec3(.9,.87,.78),vec3(.98,.96,.9),smoothstep(.3,.7,g));}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
// Same shape as the terrain meshes, inverted: 1.0 is the outer terrain ring.
float mainEdge(vec2 p){vec2 q=vec2(p.x/(p.x<0.?uMain.x:uMain.y),(p.y-8.)/(p.y<8.?uMain.z:uMain.w));float a=atan(q.y,q.x);return length(q)/(1.+sin(a*3.+.4)*.04+sin(a*7.)*.023);}
float cayEdge(vec2 p,vec4 c,float s){vec2 q=(p-c.xy)/c.zw;float a=atan(q.y,q.x);return length(q)/(1.+sin(a*3.+s)*.05+sin(a*5.+s*2.)*.03);}
// A few red starfish scattered on sandy shallows, one per lucky 3 m cell.
float starfish(vec2 p){vec2 cell=floor(p/3.);float h=hash(cell);if(h<.86)return 0.;vec2 f=p-cell*3.-1.5-(vec2(hash(cell+3.),hash(cell+7.))-.5)*1.6;float a=atan(f.y,f.x)+h*6.;return 1.-smoothstep(-.02,.02,length(f)-(.14+.09*cos(a*5.)));}

void main(){
  vec2 p=vWorld.xz;float t=uTime;
  float em=mainEdge(p);
  float d=(em-.94)*24.;
  for(int i=0;i<4;i++){vec4 c=uCays[i];d=min(d,(cayEdge(p,c,float(i)*1.7)-.94)*min(c.z,c.w)*1.3);}
  float depth=max(d,0.)*.48+(fbm(p*.35)-.5)*.6*smoothstep(0.,3.,d);depth=max(depth,0.);
  float bars=min(seg(p,uBars[0].xy,uBars[0].zw),seg(p,uBars[1].xy,uBars[1].zw));
  depth=min(depth,.25+max(bars-1.5,0.)*.35);
  // Reef: three arcs around the main island, about 9 m offshore.
  float rr=(em-1.32)*24.;
  float arcs=smoothstep(-.2,.3,sin(atan(p.y-8.,p.x)*3.+1.)+.45);
  float reef=(1.-smoothstep(0.,2.4,abs(rr)+(fbm(p*.5)-.5)*1.6))*arcs;
  depth=mix(depth,.4,reef);
  vec3 V=normalize(cameraPosition-vWorld);
  float dist=length(cameraPosition-vWorld);
  // Smooth wind-sea normal: six directional swells plus animated fine ripples (finite differences of
  // noise). Calmer in the shallows and faded with distance so the far sea does not shimmer.
  float calm=.25+.75*smoothstep(-.5,4.,d), fade=1./(1.+dist*.025);
  vec2 g=vec2(0.);
  for(int i=0;i<6;i++){float fi=float(i);float a=fi*2.17+.4;vec2 dir=vec2(cos(a),sin(a));float k=.35+fi*fi*.32;float amp=.06/(1.+fi*1.3)*exp(-dist*k*.02);
    g+=dir*amp*k*cos(dot(dir,p)*k+t*(.7+fi*.35)+fi*1.7);}
  vec2 rp=p*2.2+vec2(t*.35,-t*.22);float e=.06;
  float r0=fbm(rp),rx=fbm(rp+vec2(e,0.)),rz=fbm(rp+vec2(0.,e));
  g+=vec2(rx-r0,rz-r0)/e*.05*fade;
  #ifndef LOW_WATER
  vec2 cp=mat2(.8,-.6,.6,.8)*p*5.5+vec2(-t*.6,t*.45);float c0=noise(cp),cx=noise(cp+vec2(e,0.)),cz=noise(cp+vec2(0.,e));
  g+=vec2(cx-c0,cz-c0)/e*.022*fade*fade;
  vec2 cq=mat2(.5,.87,-.87,.5)*p*12.+vec2(t*.9,t*.3);float q0=noise(cq),qx=noise(cq+vec2(e,0.)),qz=noise(cq+vec2(0.,e));
  g+=vec2(qx-q0,qz-q0)/e*.01*fade*fade*fade;
  #endif
  vec3 N=normalize(vec3(-g.x*calm,1.,-g.y*calm));
  vec2 slope=N.xz*.6;
  vec2 bp=p+slope*depth*.45;
  float cloud=smoothstep(.55,.78,noise(p*.017+vec2(t*.012,t*.007)));
  vec3 deepc=vec3(.0,.14,.32);
  vec3 w=deepc;
  if(depth<14.) {
  vec3 bed=sandCol(bp);
  // Rippled sand on the bottom, then rocks, seagrass, reef and starfish.
  bed*=.94+.06*sin(dot(bp,vec2(2.3,1.1))*2.+fbm(bp*1.3)*4.);
  float rock=smoothstep(.7,.78,fbm(bp*.7+4.));bed=mix(bed,mix(vec3(.5,.5,.44),vec3(.66,.64,.56),noise(bp*6.)),rock*.75);
  float grass=smoothstep(.68,.76,fbm(bp*.45+11.))*smoothstep(2.,3.5,depth);bed=mix(bed,vec3(.3,.45,.33),grass*.6);
  bed=mix(bed,mix(vec3(.55,.4,.32),vec3(.38,.42,.3),noise(bp*2.)),reef*.85);
  bed=mix(bed,vec3(.86,.24,.14),starfish(bp)*(1.-smoothstep(1.,3.5,depth))*(1.-reef)*(1.-rock));
  bed+=vec3(.95,1.,.9)*smoothstep(.05,.4,caustic(bp*.11,t*.6))*.28*exp(-depth*.22)*(1.-rock*.4);
  for(int i=0;i<4;i++){
    vec4 B=uBoats[i];vec2 sq=bp-(B.xy-uSun.xz/max(uSun.y,.15)*(depth+.25));float ca=cos(B.z),sa=sin(B.z);
    vec2 l=vec2(sq.x*ca-sq.y*sa,sq.x*sa+sq.y*ca);float blur=.12+depth*.05;
    bed*=1.-(1.-smoothstep(1.-blur,1.+blur,length(l/vec2(.85,1.95))))*.5;
  }
  bed*=1.-cloud*.35;
  vec3 absorb=exp(-depth*vec3(.52,.12,.075));
  w=deepc+(bed-deepc)*absorb;w+=vec3(0.,.06,.05)*(1.-absorb.g);w=mix(w,deepc,smoothstep(10.,14.,depth));
  }
  // Reflection of the sky dome, weighted by Fresnel.
  vec3 R=reflect(-V,N);R.y=abs(R.y);
  vec3 skyCol=mix(uSkyRef,uSkyTop,pow(clamp(R.y,0.,1.),.45));
  float F=.02+.98*pow(1.-max(dot(N,V),0.),5.);
  w=mix(w,skyCol,F);
  w*=1.-cloud*.12;
  float wave=sin(d*2.2-t*1.4+fbm(p*.6)*3.);
  float band=(1.-smoothstep(0.,.6,d))*.9+smoothstep(.85,1.,wave)*(1.-smoothstep(.3,2.6,d))*.55;
  band+=smoothstep(.85,1.,sin(rr*1.6-t*1.5+fbm(p*.4)*3.))*(1.-smoothstep(0.,1.6,abs(rr-1.8)))*arcs*.8;
  float fn=fbm(p*4.+vec2(t*.3,-t*.2))*.7+fbm(p*11.-vec2(t*.2,t*.4))*.3;
  w=mix(w,vec3(.96,.97,.95),smoothstep(.42,.62,band*fn*1.5)*.92);
  float swash=.35*sin(t*.55+fbm(p*.3)*2.)-.05;
  float wet=1.-smoothstep(swash-.05,swash+.9,-d);
  vec3 sandW=sandCol(p)*mix(.82,.62,wet);
  float lip=(1.-smoothstep(0.,.12,abs(d+swash*.6)))*smoothstep(.35,.6,fbm(p*6.+t*.4));
  vec3 col=mix(sandW,w,smoothstep(-.3,0.,d+swash*.6));
  col=mix(col,vec3(.97,.98,.96),lip*.85);
  // Moonlit sea: darker, bluer, with the sun glint (now the moon) left on top.
  col=mix(col,col*vec3(.22,.3,.48),uNight);
  col=mix(col,uFog,smoothstep(uFogRange.x,uFogRange.y,dist));
  // Colors above are display-space; the post composer expects linear light. The sun glitter is added
  // in linear HDR afterwards so bloom picks it up.
  vec3 lin=pow(col,vec3(mix(2.2,1.65,uNight)));
  float sd=max(dot(R,normalize(uSun)),0.);
  #ifdef LOW_WATER
  float glint=0.;
  #else
  float glint=step(.985,noise(p*9.+N.xz*40.+t*2.))*pow(sd,40.)*3.*fade;
  #endif
  lin+=uSunCol*(glint+pow(sd,1400.)*14.*(1.-uNight*.7)+pow(sd,120.)*.35*(1.-uNight))*(1.-cloud*.8)*(1.-smoothstep(uFogRange.x,uFogRange.y*1.4,dist)*.7);
  gl_FragColor=vec4(lin,1.);
}`;


