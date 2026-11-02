// Fragment shader for the landing-page ocean.
// One full-screen pass: a wave surface seen from below (Fresnel transmission
// through Snell's window, total internal reflection, sun glints), plus water
// absorption, in-scatter, god rays and a filmic tone curve.
// Uniforms: uRes (px), uTime (s), uDepth (0 = surface, 1 = 200 m), uMouse (-1..1).

export const OCEAN_VERTEX = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

export const OCEAN_FRAGMENT = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform float uDepth; uniform vec2 uMouse;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return -1.0+2.0*mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y); }

// choppy ocean octave: sharp crests, rounded troughs
float seaOct(vec2 uv, float choppy){
  uv += noise(uv);
  vec2 wv = 1.0-abs(sin(uv)); vec2 swv = abs(cos(uv));
  wv = mix(wv, swv, wv);
  return pow(1.0-pow(wv.x*wv.y, 0.65), choppy);
}
const mat2 OCT = mat2(1.6,1.2,-1.2,1.6);
float seaH(vec2 uv, float t, float detail){
  float freq = 0.16, amp = 0.6, choppy = 4.0, h = 0.0;
  float st = t*0.55;
  for (int i = 0; i < 5; i++) {
    float d = seaOct((uv+st)*freq, choppy) + seaOct((uv-st)*freq, choppy);
    h += d*amp*clamp(detail*5.0 - float(i), 0.0, 1.0);   // drop octaves that would alias
    uv = OCT*uv; freq *= 1.9; amp *= 0.22; choppy = mix(choppy, 1.0, 0.2);
  }
  return h;
}

vec3 SUN, SUNW; float LIGHT, DM;

// light field inside the water, looking along d
vec3 waterCol(vec3 d){
  float up = d.y;
  vec3 lo = mix(vec3(0.007,0.026,0.068), vec3(0.004,0.020,0.060), smoothstep(0.,60.,DM));
  vec3 hi = mix(vec3(0.15,0.33,0.58), vec3(0.05,0.30,0.70), smoothstep(0.,30.,DM));
  vec3 c = mix(lo, hi, smoothstep(-0.9, 0.95, up));
  float s = max(dot(d, SUNW), 0.);
  c += vec3(0.30,0.46,0.60) * pow(s, 5.0) * 0.55;
  return c * LIGHT;
}

vec3 sky(vec3 d){
  float s = max(dot(d, SUN), 0.);
  vec3 c = mix(vec3(0.50,0.66,0.86), vec3(0.58,0.74,0.93), clamp(d.y,0.,1.)) + vec3(0.30,0.32,0.30)*pow(s, 5.0);
  c += vec3(1.0,0.97,0.9) * (pow(s, 900.)*160.0 + pow(s, 160.)*4.0 + pow(s, 24.)*0.35);
  return c;
}

float fresnelWA(float cosi){            // water -> air, unpolarised
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
  DM = clamp(uDepth, 0., 1.) * 200.0;                 // metres
  LIGHT = max(0.07, exp(-DM*0.0115));

  SUN  = normalize(vec3(0.05, 1.0, 0.52));
  SUNW = -normalize(refract(-SUN, vec3(0.,1.,0.), 1.0/1.333));

  float camDepth = 2.4 + DM*1.05;
  float pitch = mix(1.10, 0.80, smoothstep(0., 24., DM)) + uMouse.y*0.04 + 0.012*sin(t*0.37);
  float yaw = uMouse.x*0.07 + 0.05*sin(t*0.05);
  vec3 f = vec3(sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch));
  vec3 r = normalize(cross(vec3(0.,1.,0.), f));
  vec3 u = cross(f, r);
  vec3 rd = normalize(f*1.25 + r*uv.x + u*uv.y);

  vec3 col = waterCol(rd);

  if (rd.y > 0.002) {
    float dist = min(camDepth / rd.y, 600.0);
    vec2 P = rd.xz * dist * 1.35 + vec2(0., t*0.25);
    float detail = clamp(1.45 - log2(1.0 + dist*0.09), 0.62, 1.0);
    float eps = 0.035 + dist*0.006;
    float h0 = seaH(P, t, detail);
    vec3 n = normalize(vec3(h0 - seaH(P+vec2(eps,0.), t, detail), eps*1.15, h0 - seaH(P+vec2(0.,eps), t, detail)));
    // capillary ripples: these break the sun into glints
    float rip = detail*detail;
    n = normalize(n + vec3(noise(P*9.3 + t*2.3), 0., noise(P*9.1 - t*2.0 + 17.0)) * 0.22 * rip
                    + vec3(noise(P*3.1 - t*0.9), 0., noise(P*3.3 + t*1.1 + 5.0)) * 0.08 * rip);

    float cosi = clamp(dot(rd, n), 0.0, 1.0);
    float sinI = sqrt(1.0 - cosi*cosi);
    float band = clamp(0.10 + dist*0.003, 0.10, 0.2);      // optical blur grows with water path
    float R = mix(fresnelWA(cosi), 1.0, smoothstep(0.752 - band*1.4, 0.752 + band*0.3, sinI));
    vec3 T = refract(rd, -n, 1.333);
    vec3 Rd = reflect(rd, -n);
    vec3 surf = (1.0-R) * sky(T) + R * waterCol(Rd) * 0.95;
    // crests focus light, troughs spread it: soft brightness rolls across the window
    surf *= mix(1.0, 0.72 + 0.55*smoothstep(0.35, 1.35, h0), detail);
    // sun glitter: tiny facets flashing around the refracted sun
    float gl1 = noise(P*8.5 + vec2(t*3.1, -t*2.4));
    float gl2 = noise(P*13.0 - vec2(t*2.2, t*3.7) + 9.0);
    float glit = smoothstep(0.55, 0.85, gl1) * smoothstep(0.3, 0.8, gl2);
    surf += vec3(1.0,0.98,0.94) * glit * pow(max(dot(T, SUN), 0.), 45.0) * 14.0 * (1.0-R) * rip;

    vec3 trans = exp(-min(dist, 14.0) * vec3(0.32, 0.11, 0.05)) * exp(-max(dist-14.0, 0.0) * vec3(0.06, 0.035, 0.025));
    vec3 insc  = waterCol(rd) * (1.0 - exp(-dist * 0.045));
    col = surf * trans * mix(1.0, LIGHT, 0.6) + insc;
  }

  // sun bloom through the water column
  float sb = max(dot(rd, SUNW), 0.);
  col += vec3(0.75,0.88,1.0) * mix(1.0, 0.45, smoothstep(2., 20., DM)) * (pow(sb, 60.)*0.75 + pow(sb, 9.)*0.16 + pow(sb, 3.)*0.06) * LIGHT;

  // god rays once there is water to scatter in
  vec2 q  = rd.xz / (rd.y + 1.15);
  vec2 sq = SUNW.xz / (SUNW.y + 1.15);
  vec2 dq = q - sq;
  float ang = atan(dq.y, dq.x);
  float rays = (0.5+0.5*noise(vec2(ang*4.0, t*0.07))) * (0.5+0.5*noise(vec2(ang*9.0 + 3.0, -t*0.1)));
  rays = pow(rays, 2.2);
  float rayAmt = smoothstep(3.0, 18.0, DM) * 0.42 * LIGHT * smoothstep(0.04, 0.45, length(dq));
  col += vec3(0.45,0.70,1.0) * rays * exp(-length(dq)*1.2) * smoothstep(-0.6, 0.5, rd.y) * rayAmt;

  // gentle lens falloff
  vec2 vu = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(vu, vu) * 0.8;

  // ACES-style tone curve, slight desaturation, grain
  col *= 0.97;
  col = clamp((col*(2.51*col+0.03))/(col*(2.43*col+0.59)+0.14), 0., 1.);
  col = mix(vec3(dot(col, vec3(0.3,0.59,0.11))), col, 1.0);
  col = pow(col, vec3(0.94));
  col += (hash(gl_FragCoord.xy + fract(t*7.0)*91.0) - 0.5) * 0.022;
  gl_FragColor = vec4(col, 1.0);
}
`;
