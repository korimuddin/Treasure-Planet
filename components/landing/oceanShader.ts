// Shaders for the landing-page ocean (three.js).
// The ocean pass outputs linear HDR radiance; bloom, lens effects and AgX
// tone mapping are applied afterwards by the EffectComposer in startDive.ts.

/**
 * Full-screen ocean, looking up from just under the surface: crossing swells and chop,
 * a dawn sky with two cloud decks seen through Snell's window, sun glints, absorption
 * and light shafts.
 */
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
  vec3 glowCol = mix(vec3(0.35, 0.62, 0.95), SUNCOL * vec3(0.95, 0.78, 0.62), warm * 0.45);
  c += glowCol * (pow(s, 3.0) * 0.55 + pow(s, 12.0) * 0.5) * mix(0.45, 1.0, warm);
  c += vec3(0.05, 0.09, 0.13);   // morning ambient
  return c * LIGHT * mix(vec3(1.0), SUNCOL, 0.08 * warm);
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

uniform float uCamY;   // camera height in metres: + above the surface, - below

/* ---------- clouds and a complete sky ---------- */
float fbm5(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = OCT * p; a *= 0.5; } return v; }

vec3 skyBase(vec3 d){
  // dawn palette from reference photographs: deep blue overhead, warm grey away from the sun, gold toward it
  float y = max(d.y, 0.0);
  float near = 0.5 + 0.5 * dot(normalize(d.xz + vec2(1e-4, 0.)), normalize(uSun.xz));
  vec3 zen = vec3(0.20, 0.34, 0.60);
  vec3 mid = vec3(0.52, 0.63, 0.82);
  vec3 hzAway = vec3(0.80, 0.75, 0.74);
  vec3 hzSun = vec3(1.08, 0.80, 0.46);
  vec3 hz = mix(hzAway, hzSun, pow(near, 2.5));
  vec3 c = mix(hz, mid, smoothstep(0.0, 0.16, y));
  c = mix(c, zen, smoothstep(0.12, 0.75, y));
  float s = max(dot(d, uSun), 0.0);
  c += vec3(1.0, 0.76, 0.48) * (pow(s, 14.0) * 0.55 + pow(s, 3.0) * 0.08);
  // a thin warm layer right on the horizon
  c += vec3(1.0, 0.78, 0.5) * 0.14 * exp(-y * 45.0) * near;
  return c * SKY_GAIN;
}

// two cloud decks: broken stratocumulus lit from below by the low sun, and high stretched cirrus
vec4 clouds(vec3 rd, float t){
  if (rd.y < 0.004) return vec4(0.0);
  float d1 = 900.0 / rd.y;
  vec2 p1 = rd.xz * d1 * 0.0011 + vec2(t * 0.004, 0.0);
  vec2 w = vec2(fbm5(p1 * 0.7 + 1.3), fbm5(p1 * 0.7 + 7.9));
  float n1 = fbm5(p1 + 0.55 * w);
  float dens1 = smoothstep(0.28, 0.68, n1 * 0.5 + 0.5);
  float d2 = 5500.0 / rd.y;
  vec2 p2 = rd.xz * d2;
  float n2 = fbm5(vec2(p2.x * 0.00022, p2.y * 0.0011) + vec2(0.0, t * 0.002));
  float dens2 = smoothstep(0.52, 0.80, n2 * 0.5 + 0.5) * 0.55;
  float horizonFade = smoothstep(0.0, 0.12, rd.y);
  dens1 *= horizonFade; dens2 *= horizonFade;

  float s = max(dot(rd, uSun), 0.0);
  float toSun = smoothstep(-0.2, 1.0, dot(normalize(rd.xz), normalize(uSun.xz)));
  vec3 shade = vec3(0.38, 0.42, 0.54) * mix(0.85, 1.05, toSun);
  vec3 lit = vec3(1.18, 0.94, 0.68) * 1.05;
  // thin edges catch the sun (silver lining); thick cores sit in cool shadow
  vec3 c1 = mix(lit, shade, smoothstep(0.15, 0.85, dens1)) + SUNCOL * pow(s, 6.0) * 0.8;
  c1 *= mix(vec3(1.0), SUNCOL * 1.05, 0.3 * toSun);
  vec3 c2 = mix(lit * 0.9, vec3(0.74, 0.76, 0.84), 0.6) + SUNCOL * pow(s, 4.0) * 0.4;
  float a1 = dens1, a2 = dens2 * (1.0 - a1);
  return vec4(c1 * a1 + c2 * a2, a1 + a2);
}

vec3 skyFull(vec3 d, float t, float withSun){
  vec3 base = skyBase(d);
  vec4 cl = clouds(d, t);
  vec3 col = base * (1.0 - cl.a) + cl.rgb;
  if (withSun > 0.5) {
    float s = max(dot(d, uSun), 0.0);
    float disc = smoothstep(0.999955, 0.999975, s);   // about 0.27 degrees, soft limb
    col += SUNCOL * (disc * 28.0 + pow(s, 3000.0) * 3.0 + pow(s, 300.0) * 0.22) * (1.0 - 0.85 * cl.a);
  }
  return col;
}

/* ---------- looking at the sea from above ---------- */
// chop plus two long swells coming from ahead, so crests run across the view like a real sea
// rough open sea: several swells crossing from different directions, each with sharp
// (trochoidal) crests, on top of wind chop. Speeds follow deep-water dispersion.
float swellW(vec2 P, vec2 dir, float k, float amp, float t, float ph){
  float th = dot(P, dir) * k - sqrt(9.81 * k) * 0.55 * t + ph;
  // sharp crests, wide troughs; amplitude wanders along the crest so no wave is a clean line
  float env = 0.55 + 0.45 * sin(dot(P, vec2(-dir.y, dir.x)) * k * 0.23 + ph * 1.7 + t * 0.05);
  return amp * env * (pow(0.5 + 0.5 * sin(th), 2.2) * 2.0 - 0.6);
}
float seaA(vec2 P, float t, float detail){
  float h = seaH(P * 1.15, t * 1.25, detail) * 1.6;
  h += swellW(P, normalize(vec2(0.18, 1.0)),  0.38, 0.62, t, 0.0);
  h += swellW(P, normalize(vec2(-0.75, 0.66)), 0.61, 0.42, t, 1.9);
  h += swellW(P, normalize(vec2(0.86, 0.5)),   0.93, 0.30, t, 4.1);
  h += swellW(P, normalize(vec2(-0.3, -0.95)), 1.45, 0.18 * clamp(detail * 2.0, 0.0, 1.0), t, 2.7);
  h += swellW(P, normalize(vec2(0.97, -0.25)), 2.10, 0.11 * clamp(detail * 2.0 - 0.5, 0.0, 1.0), t, 5.3);
  return h;
}
/* ---------- looking up from under the water ---------- */
vec3 underWater(vec3 rd, float camDepth, float t){
  vec3 col = waterCol(rd);
  if (rd.y > 0.002) {
    float dist = min(camDepth / rd.y, 600.0);
    vec2 P = rd.xz * dist * 1.35 + vec2(0., t*0.25);
    float detail = clamp(1.45 - log2(1.0 + dist*0.09), 0.62, 1.0);
    float eps = 0.035 + dist*0.006;
    float h0 = seaA(P * 0.75, t, detail);
    vec3 n = normalize(vec3(h0 - seaA((P+vec2(eps,0.)) * 0.75, t, detail), eps*0.85, h0 - seaA((P+vec2(0.,eps)) * 0.75, t, detail)));
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
    vec3 skyT = skyFull(normalize(T + vec3(0., 1e-3, 0.)), t, 0.0) * 2.8;
    float s = max(dot(T, uSun), 0.);
    vec3 sunL = SUNCOL * (pow(s, 900.)*90.0 + pow(s, 140.)*6.0 + pow(s, 22.)*1.2 + pow(s, 6.)*0.5);
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
  float sb = max(dot(rd, SUNW), 0.);
  col += vec3(0.62,0.80,1.0) * SUNCOL * mix(1.0, 0.45, smoothstep(2., 20., DM)) * (pow(sb, 60.)*0.5 + pow(sb, 9.)*0.12 + pow(sb, 3.)*0.05) * LIGHT;
  vec2 q  = rd.xz / (rd.y + 1.15);
  vec2 sq = SUNW.xz / (SUNW.y + 1.15);
  vec2 dq = q - sq;
  float ang = atan(dq.y, dq.x);
  float rays = (0.5+0.5*noise(vec2(ang*4.0, t*0.07))) * (0.5+0.5*noise(vec2(ang*9.0 + 3.0, -t*0.1)));
  rays = pow(rays, 2.2);
  float rayAmt = smoothstep(3.0, 18.0, DM) * 0.42 * LIGHT * smoothstep(0.04, 0.45, length(dq));
  col += vec3(0.45,0.70,1.0) * SUNCOL * rays * exp(-length(dq)*1.2) * smoothstep(-0.6, 0.5, rd.y) * rayAmt;
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime;
  DM = clamp(uDepth, 0., 1.) * 200.0;
  LIGHT = max(0.07, exp(-DM*0.0115)) * mix(uDayLight, 0.9, smoothstep(0., 22., DM));
  SUNW = -normalize(refract(-uSun, vec3(0.,1.,0.), 1.0/1.333));
  vec3 fx; sky(uSun, fx);
  SUNCOL = clamp(fx / max(max(fx.r, fx.g), fx.b), 0.0, 1.0);
  SUNCOL = mix(SUNCOL, vec3(1.0, 0.86, 0.62), 0.6);

  vec3 rd = normalize(uF*1.25 + uR*uv.x + uU*uv.y);
  vec3 col = underWater(rd, uCamDepth, t);

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
  vEnergy = step(p.y, -0.08) * clamp((sharpPx*sharpPx) / (rPx*rPx) * 60.0, 0.0, 6.0) * smoothstep(0.2, 0.6, d) * (1.0 - smoothstep(9.0, 13.0, d));
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
