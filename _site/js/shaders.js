// GLSL shaders — Gold Kings Online edition
// Adapted from premium-webgl-site with warm gold palette

export const heroVertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const heroFragment = /* glsl */`
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uImageSize;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float rRes = res.x / res.y;
    float rImg = img.x / img.y;
    vec2 scale = vec2(1.0);
    vec2 offset = vec2(0.0);
    if (rRes < rImg) {
      scale.x = (res.y * rImg) / res.x;
      offset.x = (1.0 - scale.x) * 0.5;
    } else {
      scale.y = (res.x / rImg) / res.y;
      offset.y = (1.0 - scale.y) * 0.5;
    }
    return uv * scale + offset;
  }

  void main() {
    vec2 uv = coverUv(vUv, uResolution, uImageSize);

    // breath
    float breath = sin(uTime * 0.3) * 0.004;
    uv += vec2(breath, breath * 0.6);

    // mouse ripple
    float d = distance(vUv, uMouse);
    float ripple = sin(d * 26.0 - uTime * 3.2) * 0.010;
    ripple *= smoothstep(0.5, 0.0, d) * uHover;
    vec2 dir = normalize(vUv - uMouse + 0.0001);
    uv += dir * ripple;

    // rgb split with warm gold bias
    float split = 0.002 * uHover;
    vec3 col;
    if (split > 0.0001) {
      col.r = texture2D(uTexture, uv + vec2(split * 1.4, 0.0)).r;
      col.g = texture2D(uTexture, uv).g;
      col.b = texture2D(uTexture, uv - vec2(split * 0.6, 0.0)).b;
    } else {
      col = texture2D(uTexture, uv).rgb;
    }

    // GOLD: warm tone bias
    col = col * vec3(1.06, 1.01, 0.88);

    // GOLD: diagonal shimmer sweep
    float shimmerAngle = vUv.x * 0.7 + vUv.y * 0.5;
    float shimmer = pow(sin(shimmerAngle * 8.0 - uTime * 0.4) * 0.5 + 0.5, 6.0);
    shimmer *= 0.06;
    col += vec3(0.886, 0.753, 0.420) * shimmer;

    // GOLD: hover glow
    float hoverGlow = smoothstep(0.4, 0.0, d) * uHover;
    col += vec3(0.886, 0.753, 0.420) * hoverGlow * 0.12;

    // vignette (stronger for luxury dark feel)
    float v = 1.0 - smoothstep(0.55, 1.2, distance(vUv, vec2(0.5)));
    col *= 0.88 + 0.12 * v;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const cardVertex = heroVertex;

export const cardFragment = /* glsl */`
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uImageSize;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float rRes = res.x / res.y;
    float rImg = img.x / img.y;
    vec2 scale = vec2(1.0);
    vec2 offset = vec2(0.0);
    if (rRes < rImg) {
      scale.x = (res.y * rImg) / res.x;
      offset.x = (1.0 - scale.x) * 0.5;
    } else {
      scale.y = (res.x / rImg) / res.y;
      offset.y = (1.0 - scale.y) * 0.5;
    }
    return uv * scale + offset;
  }

  void main() {
    vec2 uv = coverUv(vUv, uResolution, uImageSize);

    // distortion pulled toward mouse
    vec2 toMouse = uMouse - vUv;
    float d = length(toMouse);
    float strength = smoothstep(0.55, 0.0, d) * uHover;
    uv += toMouse * 0.08 * strength;

    // zoom on hover
    vec2 center = vec2(0.5);
    uv = (uv - center) / (1.0 + 0.04 * uHover) + center;

    // chromatic split
    float split = 0.004 * uHover;
    vec3 col;
    col.r = texture2D(uTexture, uv + vec2(split, 0.0)).r;
    col.g = texture2D(uTexture, uv).g;
    col.b = texture2D(uTexture, uv - vec2(split, 0.0)).b;

    // GOLD: warm saturation flip on hover
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 warmGray = mix(vec3(gray), col * vec3(1.05, 1.0, 0.85), 0.5);
    col = mix(warmGray, col * vec3(1.08, 1.02, 0.82), uHover);

    // GOLD: gold edge glow on hover
    float edgeDist = min(min(vUv.x, 1.0-vUv.x), min(vUv.y, 1.0-vUv.y));
    float edge = (1.0 - smoothstep(0.0, 0.06, edgeDist)) * uHover * 0.3;
    col += vec3(0.886, 0.753, 0.420) * edge;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const showcaseVertex = heroVertex;

export const showcaseFragment = /* glsl */`
  precision highp float;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform vec2 uImageSizeA;
  uniform vec2 uImageSizeB;
  uniform float uMix;
  uniform float uDistort;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uHover;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec2 coverUv(vec2 uv, vec2 res, vec2 img) {
    float rRes = res.x / res.y;
    float rImg = img.x / img.y;
    vec2 scale = vec2(1.0);
    vec2 offset = vec2(0.0);
    if (rRes < rImg) {
      scale.x = (res.y * rImg) / res.x;
      offset.x = (1.0 - scale.x) * 0.5;
    } else {
      scale.y = (res.x / rImg) / res.y;
      offset.y = (1.0 - scale.y) * 0.5;
    }
    return uv * scale + offset;
  }

  void main() {
    vec2 uv = vUv;

    // flow field distortion driven by scroll swap
    float n = noise(uv * 4.0 + uTime * 0.05);
    vec2 flow = vec2(cos(n * 6.28), sin(n * 6.28));
    uv += flow * 0.06 * uDistort;

    // subtle mouse parallax
    uv += (uMouse - 0.5) * 0.01 * uHover;

    vec2 uvA = coverUv(uv, uResolution, uImageSizeA);
    vec2 uvB = coverUv(uv, uResolution, uImageSizeB);

    vec3 a = texture2D(uTexA, uvA).rgb;
    vec3 b = texture2D(uTexB, uvB).rgb;

    // mask driven crossfade
    float m = smoothstep(0.0, 1.0, uMix + (n - 0.5) * 0.25);
    vec3 col = mix(a, b, m);

    // GOLD: warm editorial grade
    col = mix(col, col * vec3(1.05, 1.01, 0.88), 0.3);

    // GOLD: shimmer during transition
    vec3 goldSheen = vec3(0.886, 0.753, 0.420);
    float transitionShimmer = uDistort * 0.08 * sin(vUv.x * 12.0 + uTime * 2.0);
    col += goldSheen * max(0.0, transitionShimmer);

    // vignette
    float v = 1.0 - smoothstep(0.45, 1.2, distance(vUv, vec2(0.5)));
    col *= 0.82 + 0.18 * v;

    gl_FragColor = vec4(col, 1.0);
  }
`;
