// Shaders for the landing-page ocean (three.js).
// The ocean pass outputs linear HDR radiance; bloom, lens effects and AgX
// tone mapping are applied afterwards by the EffectComposer in startDive.ts.

/** Full-screen ocean: wave surface seen from below, Preetham sky through Snell's window, sun glints, absorption, light shafts. */
export const OCEAN_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uDepth; uniform float uCamDepth;
uniform vec3 uF, uR, uU;
uniform vec3 uSun; uniform float uSunE, uSunfade; uniform vec3 uBetaR, uBetaM; uniform float uMieG;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return -1.0+2.0*mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y); }

float seaOct(vec2 uv, float choppy){
  uv += noise(uv);
  vec2 wv = 1.0-abs(sin(uv)); vec2 swv = abs(cos(uv));
  wv = mix(wv, swv, wv);
  return pow(1.0-pow(wv.x*wv.y, 0.65), choppy);
}
const mat2 OCT = mat2(1.6,1.2,-1.2,1.6);
float seaH(vec2 uv, float t, float detail){
  float freq = 0.16, amp = 0.6, choppy = 4.0, h = 0.0;
  // octave speeds follow deep-water dispersion: longer waves travel faster
  float st = t*0.55;
  for (int i = 0; i < 5; i++) {
    float sp = st / sqrt(freq/0.16);
    float d = seaOct((uv+sp)*freq, choppy) + seaOct((uv-sp)*freq, choppy);
    h += d*amp*clamp(detail*5.0 - float(i), 0.0, 1.0);
    uv = OCT*uv; freq *= 1.9; amp *= 0.22; choppy = mix(choppy, 1.0, 0.2);
  }
  return h;
}

/* ---- Preetham sky ---- */
const float PI = 3.141592653589793;
float rayleighPhase(float c){ return 0.05968310365946075 * (1.0 + c*c); }
float hgPhase(float c, float g){ float g2=g*g; return 0.07957747154594767 * ((1.0-g2) / pow(1.0 - 2.0*g*c + g2, 1.5)); }
vec3 skyFex(vec3 d){
  float z = acos(max(0.0, d.y));
  float inv = 1.0 / (cos(z) + 0.15 * pow(93.885 - (z*180.0/PI), -1.253));
  return exp(-(uBetaR * 8.4e3 * inv + uBetaM * 1.25e3 * inv));
}
vec3 sky(vec3 d, out vec3 fexOut){
  vec3 Fex = skyFex(d); fexOut = Fex;
  float c = dot(d, uSun);
  vec3 bR = uBetaR * rayleighPhase(c*0.5+0.5);
  vec3 bM = uBetaM * hgPhase(c, uMieG);
  vec3 Lin = pow(uSunE * ((bR + bM)/(uBetaR + uBetaM)) * (1.0 - Fex), vec3(1.5));
  Lin *= mix(vec3(1.0), pow(uSunE * ((bR + bM)/(uBetaR + uBetaM)) * Fex, vec3(0.5)), clamp(pow(1.0 - uSun.y, 5.0), 0., 1.));
  vec3 L0 = vec3(0.1) * Fex;
  vec3 col = (Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
  return pow(col, vec3(1.0/(1.2 + 1.2*uSunfade)));
}

vec3 SUNW, SUNCOL; float LIGHT, DM;
uniform float uSkyGain; uniform float uDayLight;
#define SKY_GAIN uSkyGain

vec3 waterCol(vec3 d){
  vec3 lo = mix(vec3(0.007,0.026,0.068), vec3(0.004,0.020,0.060), smoothstep(0.,60.,DM));
  vec3 hi = mix(vec3(0.15,0.33,0.58), vec3(0.05,0.30,0.70), smoothstep(0.,30.,DM));
  vec3 c = mix(lo, hi, smoothstep(-0.9, 0.95, d.y));
  float s = max(dot(d, SUNW), 0.);
  // a low sun lights the water from the side: a broad warm glow toward it
  // warm light is absorbed within the first few metres, so the glow cools to blue as you sink
  float warm = exp(-DM * 0.16);
  vec3 glowCol = mix(vec3(0.35, 0.62, 0.95), SUNCOL * vec3(0.95, 0.78, 0.62), warm);
  c += glowCol * (pow(s, 3.0) * 0.55 + pow(s, 12.0) * 0.5) * mix(0.45, 1.0, warm);
  c += vec3(0.05, 0.09, 0.13);   // morning ambient
  return c * LIGHT * mix(vec3(1.0), SUNCOL, 0.25 * warm);
}

float fresnelWA(float cosi){
  float n1 = 1.333, n2 = 1.0;
  float sint2 = n1*n1*(1.0-cosi*cosi);
  if (sint2 >= 1.0) return 1.0;
  float cost = sqrt(1.0-sint2);
  float rs = (n1*cosi - n2*cost)/(n1*cosi + n2*cost);
  float rp = (n1*cost - n2*cosi)/(n1*cost + n2*cosi);
  return 0.5*(rs*rs + rp*rp);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime;
  DM = clamp(uDepth, 0., 1.) * 200.0;
  LIGHT = max(0.07, exp(-DM*0.0115)) * mix(uDayLight, 0.9, smoothstep(0., 22., DM));
  SUNW = -normalize(refract(-uSun, vec3(0.,1.,0.), 1.0/1.333));
  vec3 fx; sky(uSun, fx);
  SUNCOL = clamp(fx / max(max(fx.r, fx.g), fx.b), 0.0, 1.0);   // sun tint after the atmosphere
  SUNCOL = mix(SUNCOL, vec3(1.0, 0.74, 0.58), 0.35);            // nudge toward a peach sunrise

  float camDepth = uCamDepth;
  vec3 rd = normalize(uF*1.25 + uR*uv.x + uU*uv.y);
  vec3 col = waterCol(rd);

  if (rd.y > 0.002) {
    float dist = min(camDepth / rd.y, 600.0);
    vec2 P = rd.xz * dist * 1.35 + vec2(0., t*0.25);
    float detail = clamp(1.45 - log2(1.0 + dist*0.09), 0.62, 1.0);
    float eps = 0.035 + dist*0.006;
    float h0 = seaH(P, t, detail);
    vec3 n = normalize(vec3(h0 - seaH(P+vec2(eps,0.), t, detail), eps*1.15, h0 - seaH(P+vec2(0.,eps), t, detail)));
    float rip = detail*detail;
    n = normalize(n + vec3(noise(P*9.3 + t*2.3), 0., noise(P*9.1 - t*2.0 + 17.0)) * 0.22 * rip
                    + vec3(noise(P*3.1 - t*0.9), 0., noise(P*3.3 + t*1.1 + 5.0)) * 0.08 * rip);

    float cosi = clamp(dot(rd, n), 0.0, 1.0);
    float sinI = sqrt(1.0 - cosi*cosi);
    float band = clamp(0.10 + dist*0.003, 0.10, 0.2);
    float R = mix(fresnelWA(cosi), 1.0, smoothstep(0.752 - band*1.4, 0.752 + band*0.3, sinI));
    vec3 T = refract(rd, -n, 1.333);
    vec3 Rd = reflect(rd, -n);

    vec3 fexT;
    vec3 skyT = sky(normalize(T + vec3(0., 1e-3, 0.)), fexT) * SKY_GAIN;
    // the sun itself: a tight HDR core plus a forward-scatter lobe, coloured by the atmosphere
    float s = max(dot(T, uSun), 0.);
    vec3 sunL = SUNCOL * (pow(s, 900.)*90.0 + pow(s, 140.)*4.0 + pow(s, 22.)*0.35);
    vec3 surf = (1.0-R) * (skyT + sunL) + R * waterCol(Rd) * 0.95;
    surf *= mix(1.0, 0.72 + 0.55*smoothstep(0.35, 1.35, h0), detail);
    float gl1 = noise(P*8.5 + vec2(t*3.1, -t*2.4));
    float gl2 = noise(P*13.0 - vec2(t*2.2, t*3.7) + 9.0);
    float glit = smoothstep(0.55, 0.85, gl1) * smoothstep(0.3, 0.8, gl2);
    surf += SUNCOL * glit * pow(s, 45.0) * 26.0 * (1.0-R) * rip;

    vec3 trans = exp(-min(dist, 14.0) * vec3(0.32, 0.11, 0.05)) * exp(-max(dist-14.0, 0.0) * vec3(0.06, 0.035, 0.025));
    vec3 insc  = waterCol(rd) * (1.0 - exp(-dist * 0.045));
    col = surf * trans * mix(1.0, LIGHT, 0.6) + insc;
  }

  // forward scattering around the sun through the water column
  float sb = max(dot(rd, SUNW), 0.);
  col += vec3(0.62,0.80,1.0) * SUNCOL * mix(1.0, 0.45, smoothstep(2., 20., DM)) * (pow(sb, 60.)*0.5 + pow(sb, 9.)*0.12 + pow(sb, 3.)*0.05) * LIGHT;

  // light shafts: the surface's moving bright pattern projected down through haze
  vec2 q  = rd.xz / (rd.y + 1.15);
  vec2 sq = SUNW.xz / (SUNW.y + 1.15);
  vec2 dq = q - sq;
  float ang = atan(dq.y, dq.x);
  float rays = (0.5+0.5*noise(vec2(ang*4.0, t*0.07))) * (0.5+0.5*noise(vec2(ang*9.0 + 3.0, -t*0.1)));
  rays = pow(rays, 2.2);
  float rayAmt = smoothstep(3.0, 18.0, DM) * 0.42 * LIGHT * smoothstep(0.04, 0.45, length(dq));
  col += vec3(0.45,0.70,1.0) * SUNCOL * rays * exp(-length(dq)*1.2) * smoothstep(-0.6, 0.5, rd.y) * rayAmt;

  // the look above was tuned in display space; convert to linear light for the HDR pipeline
  // highlights above 1 stay linear (so the sun and glints drive the bloom) and clip like a sensor at 8
  col = max(col, 0.0);
  col = pow(min(col, 1.0), vec3(2.2)) + max(col - 1.0, 0.0) * 0.6;
  col = min(col, vec3(8.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export const OCEAN_VERTEX = /* glsl */ `void main(){ gl_Position = vec4(position.xy, 1.0, 1.0); }`;

/** Marine snow drawn as out-of-focus bokeh discs with a real circle of confusion. */
export const SNOW_VERTEX = /* glsl */ `
uniform vec3 uCam; uniform vec3 uBox; uniform float uTime; uniform float uPx; uniform float uFocus; uniform float uAperture;
uniform vec3 uSunW;
attribute float aSeed;
varying float vEnergy; varying float vLit; varying float vRim;
void main(){
  vec3 p = position + vec3(sin(uTime*0.23 + aSeed*40.0)*0.25, uTime*(0.015 + aSeed*0.03), cos(uTime*0.19 + aSeed*27.0)*0.25);
  p = uCam + mod(p - uCam + uBox*0.5, uBox) - uBox*0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float d = max(-mv.z, 0.05);
  float size = mix(0.0025, 0.012, aSeed*aSeed);                 // particle radius, metres
  float sharpPx = size * uPx / d;
  float cocPx = uAperture * abs(d - uFocus) / d * uPx;         // circle of confusion
  float rPx = max(sharpPx + cocPx, 0.75);
  gl_PointSize = min(rPx * 2.0, 48.0);
  vEnergy = clamp((sharpPx*sharpPx) / (rPx*rPx) * 60.0, 0.0, 6.0) * smoothstep(0.2, 0.6, d) * (1.0 - smoothstep(9.0, 13.0, d));
  vec3 dir = normalize(p - uCam);
  vLit = 0.35 + 2.4 * pow(max(dot(dir, uSunW), 0.0), 5.0);
  vRim = smoothstep(4.0, 20.0, rPx);
  gl_Position = projectionMatrix * mv;
}`;

export const SNOW_FRAGMENT = /* glsl */ `
uniform float uLight; uniform vec3 uTint;
varying float vEnergy; varying float vLit; varying float vRim;
void main(){
  float r = length(gl_PointCoord - 0.5) * 2.0;
  if (r > 1.0) discard;
  float disc = 1.0 - smoothstep(0.82, 1.0, r);
  disc *= mix(1.0, 0.75 + 0.45*smoothstep(0.55, 0.95, r), vRim);   // faint bright rim on big bokeh, like a real lens
  gl_FragColor = vec4(uTint * disc * vEnergy * vLit * uLight * 0.035, 1.0);
}`;

export const PASS_VERTEX = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

/** Chromatic fringing toward the edges and a vignette, in linear HDR. */
export const LENS_FRAGMENT = /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uCA; uniform float uVig; varying vec2 vUv;
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c, c);
      vec2 off = c * uCA * (1.0 + 4.0*r2);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      col *= mix(1.0, 1.0 - r2 * 1.6, uVig);
      gl_FragColor = vec4(col, 1.0);
    }`;

/** Film grain after tone mapping, strongest in the shadows. */
export const GRAIN_FRAGMENT = /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uAmt; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299,0.587,0.114));
      float g = (h(gl_FragCoord.xy) - 0.5) * uAmt * (1.0 - l*0.6);   // grain is strongest in the shadows
      gl_FragColor = vec4(c.rgb + g, 1.0);
    }`;
