export const BG_VERT = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

export const BG_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uBase;
  uniform float uTime;
  uniform vec2 uRes;
  void main(){
    vec2 p = vUv - 0.5;
    float rad = length(p) * 1.41421356;
    vec3 c = uBase * (1.0 + 0.25 * (1.0 - clamp(rad, 0.0, 1.0)));
    float g = fract(sin(dot(gl_FragCoord.xy + vec2(uTime*37.0), vec2(12.9898,78.233))) * 43758.5453);
    c += (g - 0.5) * 0.012;
    gl_FragColor = vec4(c, 1.0);
  }`;

export const CARD_VERT = `
  precision highp float;
  uniform vec2  uRes;
  uniform float uX;
  uniform float uS;
  uniform float uGrid;
  uniform vec4  uGR;
  uniform float uMobile;

  varying vec2 vUv;
  varying vec2 vSize;

  void main(){
    vUv = uv;

    float W = uRes.x;
    float H = uRes.y;
    float mob = uMobile;
    float mm  = mix(1.0, 1.6, mob);
    float cw  = 0.174 * W;

    float xPx = (0.5 + uX) * W + position.x * cw * uS;
    float dxn = xPx / W - 0.5;

    float topBase = mix(0.217, 0.26, mob);
    float botBase = mix(0.659, 0.60, mob);

    float topY = H * (topBase - 0.03 * smoothstep(0.30 * mm, 0.45 * mm, abs(dxn)));
    float botY = H * (botBase - 0.135 * smoothstep(0.12 * mm, 0.39 * mm, abs(uX)));

    float cy  = (topY + botY) * 0.5;
    float hgt = (botY - topY) * uS;
    float yPx = cy - (uv.y - 0.5) * hgt;

    vec2 gP = uGR.xy + vec2(uv.x * uGR.z, (1.0 - uv.y) * uGR.w);
    vec2 p  = mix(vec2(xPx, yPx), gP, uGrid);

    vSize = mix(vec2(cw * uS, hgt), uGR.zw, uGrid);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
  }
`;

export const CARD_FRAG = `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uLoaded;
  uniform float uRev;
  uniform float uSeed;
  uniform float uHover;

  varying vec2 vUv;
  varying vec2 vSize;

  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main(){
    vec2 uv = vUv;
    vec3 col;

    if(uLoaded < 0.5){
      col = vec3(0.05);
    } else {
      col = texture2D(uTex, uv).rgb;
    }

    /* --- 5 x 7 block-reveal glitch --- */
    vec2 cell = floor(uv * vec2(5.0, 7.0));
    float r = hash21(cell + uSeed) * 0.92 + 0.04;

    if(r > uRev){
      vec3 dark = vec3(0.043, 0.043, 0.058);
      if(r - uRev < 0.12){
        vec2 cc = (cell + 0.5) / vec2(5.0, 7.0);
        vec3 px = texture2D(uTex, cc).rgb * 0.8;
        dark = mix(dark, px, 0.85);
      }
      col = dark;
    }

    col *= 1.0 + 0.08 * uHover;

    /* --- rounded rect SDF in real pixels --- */
    vec2 sz = max(vSize, vec2(1.0));
    float rad = sz.x * 0.048;
    vec2 p = (uv - 0.5) * sz;
    vec2 q = abs(p) - (sz * 0.5 - rad);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
    float a = 1.0 - smoothstep(-0.8, 0.8, d);
    if(a < 0.008) discard;

    gl_FragColor = vec4(col, a);
  }
`;

export const GLASS_VERT = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

export const GLASS_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform vec2 uRes;
  uniform float uTime;

  float sdRR(vec2 p, vec2 res, float r){
    vec2 q = abs(p - res * 0.5) - (res * 0.5 - r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main(){
    vec2 px = vUv * uRes;
    float mn = min(uRes.x, uRes.y);
    float rr = 0.22 * mn;

    float sd = sdRR(px, uRes, rr);
    float d  = -sd;

    float rim = 0.17 * mn * (1.0 + 0.30 * smoothstep(0.25, 0.0, vUv.y));
    float t = clamp(1.0 - d / rim, 0.0, 1.0);

    float e = 1.0;
    float gx = sdRR(px + vec2(e,0.0), uRes, rr) - sdRR(px - vec2(e,0.0), uRes, rr);
    float gy = sdRR(px + vec2(0.0,e), uRes, rr) - sdRR(px - vec2(0.0,e), uRes, rr);
    vec2 n = normalize(vec2(gx, gy) + vec2(1e-6));

    vec2 off = -n * t * t * rim * 0.46;
    vec2 tg  = vec2(-n.y, n.x);
    float spread = t * t * t * 0.003 * mn;

    vec3 col = vec3(0.0);
    for(int i = -2; i <= 2; i++){
      float f = float(i) * 0.5;
      vec2 o = off + tg * f * spread;
      col.r += texture2D(uScene, (px + o * 1.06) / uRes).r;
      col.g += texture2D(uScene, (px + o * 1.00) / uRes).g;
      col.b += texture2D(uScene, (px + o * 0.94) / uRes).b;
    }
    col /= 5.0;

    float ang = atan((px.y - uRes.y * 0.5) / uRes.y,
                     (px.x - uRes.x * 0.5) / uRes.x);
    float T = uTime;

    float lr = 0.5 + 0.5 * (0.62 * sin(2.0*ang + 0.55*T) + 0.38 * sin(3.0*ang - 0.41*T + 1.7));
    float lg = 0.5 + 0.5 * (0.62 * sin(2.0*ang - 0.47*T + 2.3) + 0.38 * sin(ang      - 0.33*T + 4.1));
    float lb = 0.5 + 0.5 * (0.62 * sin(ang      + 0.38*T + 4.6) + 0.38 * sin(3.0*ang + 0.52*T + 0.9));

    lr = smoothstep(0.32, 0.9, lr);
    lg = smoothstep(0.32, 0.9, lg);
    lb = smoothstep(0.32, 0.9, lb);
    lg *= 1.0 - 0.65 * lr;

    vec3 L = vec3(lr, lg, lb);

    float xEdge = min(px.x, uRes.x - px.x);
    float bEdge = px.y;
    float tEdge = uRes.y - px.y;
    float kk = min(min(xEdge / (0.12 * uRes.x), bEdge / (0.19 * uRes.y)),
                   tEdge / (0.09 * uRes.y));
    kk = clamp(kk, 0.0, 1.0);
    float mask = pow(1.0 - kk, 1.7);

    vec3 light = L + vec3(0.16, 0.15, 0.34);
    float lum = dot(light, vec3(0.299, 0.587, 0.114));
    light = mix(light, vec3(lum), 0.12);

    col += light * mask * 0.34;

    gl_FragColor = vec4(col, 1.0);
  }`;