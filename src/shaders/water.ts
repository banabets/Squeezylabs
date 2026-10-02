// Clear Caribbean water around the archipelago: visible seabed with refraction, depth absorption,
// caustics, sandbars, a reef with breaking waves, starfish, cloud shadows, shoreline foam and the
// peñeros' shadows on the bottom. Colors are display-space and fogged by hand, so the material skips
// tone mapping and color-space chunks.
export const waterVertex = /* glsl */`
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

export const waterFragment = /* glsl */`
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uFog;
uniform vec3 uSkyRef;
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
vec3 sandCol(vec2 p){float g=fbm(p*2.5);vec3 c=mix(vec3(.82,.73,.56),vec3(.95,.89,.75),g);c*=.93+.07*hash(floor(p*90.));float rip=sin(p.x*5.+fbm(p*.8)*6.)*.5+.5;return c*(.95+.05*rip);}
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
  float depth=max(d,0.)*.35+(fbm(p*.35)-.5)*.6*smoothstep(0.,3.,d);depth=max(depth,0.);
  float bars=min(seg(p,uBars[0].xy,uBars[0].zw),seg(p,uBars[1].xy,uBars[1].zw));
  depth=min(depth,.25+max(bars-1.5,0.)*.35);
  // Reef: three arcs around the main island, about 9 m offshore.
  float rr=(em-1.32)*24.;
  float arcs=smoothstep(-.2,.3,sin(atan(p.y-8.,p.x)*3.+1.)+.45);
  float reef=(1.-smoothstep(0.,2.4,abs(rr)+(fbm(p*.5)-.5)*1.6))*arcs;
  depth=mix(depth,.4,reef);
  vec3 V=normalize(cameraPosition-vWorld);
  vec2 q=p*1.1+vec2(t*.35,t*.2);float e=.06;
  float h0=fbm(q),hx=fbm(q+vec2(e,0.)),hz=fbm(q+vec2(0.,e));
  vec2 q2=p*2.7-vec2(t*.5,-t*.3);float g0=noise(q2),gx=noise(q2+vec2(e,0.)),gz=noise(q2+vec2(0.,e));
  vec2 slope=vec2(hx-h0,hz-h0)/e*.14+vec2(gx-g0,gz-g0)/e*.04;
  vec3 N=normalize(vec3(-slope.x,1.,-slope.y));
  vec2 bp=p+slope*depth*.55;
  float cloud=smoothstep(.55,.78,noise(p*.017+vec2(t*.012,t*.007)));
  vec3 w=vec3(.0,.13,.2);
  if(depth<14.) {
  vec3 bed=sandCol(bp);
  float rock=smoothstep(.6,.68,fbm(bp*.7+4.));bed=mix(bed,vec3(.44,.46,.41)*(.7+.5*noise(bp*6.)),rock*.85);
  float grass=smoothstep(.55,.66,fbm(bp*.45+11.))*smoothstep(3.,7.,depth);bed=mix(bed,vec3(.16,.28,.19),grass*.8);
  bed=mix(bed,mix(vec3(.55,.4,.32),vec3(.38,.42,.3),noise(bp*2.)),reef*.85);
  bed=mix(bed,vec3(.86,.24,.14),starfish(bp)*(1.-smoothstep(1.,3.5,depth))*(1.-reef)*(1.-rock));
  bed+=vec3(.95,1.,.9)*caustic(bp*.11,t*.6)*.6*exp(-depth*.22)*(1.-rock*.4);
  for(int i=0;i<4;i++){
    vec4 B=uBoats[i];vec2 sq=bp-(B.xy-uSun.xz/max(uSun.y,.15)*(depth+.25));float ca=cos(B.z),sa=sin(B.z);
    vec2 l=vec2(sq.x*ca-sq.y*sa,sq.x*sa+sq.y*ca);float blur=.12+depth*.05;
    bed*=1.-(1.-smoothstep(1.-blur,1.+blur,length(l/vec2(.85,1.95))))*.5;
  }

  bed*=1.-cloud*.35;
  vec3 absorb=exp(-depth*vec3(.42,.085,.07));vec3 deepc=vec3(.0,.13,.2);
  w=deepc+(bed-deepc)*absorb;w+=vec3(0.,.05,.05)*(1.-absorb.g);w=mix(w,vec3(.0,.13,.2),smoothstep(10.,14.,depth));
  }
  float F=.02+.98*pow(1.-max(dot(N,V),0.),5.);w=mix(w,uSkyRef,F*.7);
  vec3 R=reflect(-V,N);w+=vec3(1.,.95,.85)*pow(max(dot(R,uSun),0.),160.)*1.3*(1.-cloud*.7);
  w*=1.-cloud*.12;
  float wave=sin(d*2.2-t*1.4+fbm(p*.6)*3.);
  float band=(1.-smoothstep(0.,.6,d))*.9+smoothstep(.85,1.,wave)*(1.-smoothstep(.3,2.6,d))*.55;
  band+=smoothstep(.7,1.,sin(rr*1.6-t*1.5+fbm(p*.4)*3.))*(1.-smoothstep(0.,3.,abs(rr-1.8)))*arcs;
  float fn=smoothstep(.42,.7,fbm(p*4.+vec2(t*.3,-t*.2)));
  w=mix(w,vec3(.97,.98,.96),clamp(band*fn*1.5,0.,1.));
  vec3 col=mix(sandCol(p)*.8,w,smoothstep(-.3,0.,d));
  col=mix(col,uFog,smoothstep(uFogRange.x,uFogRange.y,length(cameraPosition-vWorld)));
  gl_FragColor=vec4(col,1.);
}`;


