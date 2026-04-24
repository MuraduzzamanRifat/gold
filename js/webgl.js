import * as THREE from 'three';
import { heroVertex, heroFragment, cardVertex, cardFragment, showcaseVertex, showcaseFragment } from './shaders.js';

// ============================================================
// Texture loader (returns { texture, image })
// ============================================================
const texLoader = new THREE.TextureLoader();
texLoader.setCrossOrigin('anonymous');

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    texLoader.load(
      url,
      tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

// ============================================================
// Hero WebGL — fullscreen image with mouse distortion
// ============================================================
export async function initHero({ canvas, imageUrl, onProgress }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const texture = await loadTexture(imageUrl);
  onProgress && onProgress(1);

  const uniforms = {
    uTexture: { value: texture },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImageSize: { value: new THREE.Vector2(texture.image.naturalWidth, texture.image.naturalHeight) }
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: heroVertex,
      fragmentShader: heroFragment
    })
  );
  scene.add(mesh);

  const target = { x: 0.5, y: 0.5, h: 0 };
  const current = { x: 0.5, y: 0.5, h: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    uniforms.uResolution.value.set(rect.width, rect.height);
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    target.x = x; target.y = y; target.h = 1;
  }
  function onLeave() { target.h = 0; }

  window.addEventListener('resize', resize);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  resize();

  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    uniforms.uTime.value += dt;

    // smooth lerp
    const k = 1 - Math.pow(0.001, dt);
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    current.h += (target.h - current.h) * k;

    uniforms.uMouse.value.set(current.x, current.y);
    uniforms.uHover.value = current.h;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return { renderer, scene, camera, uniforms };
}

// ============================================================
// Journal card WebGL — per card plane w/ hover distortion
// ============================================================
export async function initCard({ canvas, imageUrl }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let texture;
  try {
    texture = await loadTexture(imageUrl);
  } catch (e) {
    console.warn('Texture failed', imageUrl, e);
    return null;
  }

  const uniforms = {
    uTexture: { value: texture },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uImageSize: { value: new THREE.Vector2(texture.image.naturalWidth, texture.image.naturalHeight) }
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      transparent: true
    })
  );
  scene.add(mesh);

  const target = { x: 0.5, y: 0.5, h: 0 };
  const current = { x: 0.5, y: 0.5, h: 0 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    uniforms.uResolution.value.set(rect.width, rect.height);
  }

  const parent = canvas.parentElement;
  function onMove(e) {
    const rect = parent.getBoundingClientRect();
    target.x = (e.clientX - rect.left) / rect.width;
    target.y = 1.0 - (e.clientY - rect.top) / rect.height;
    target.h = 1;
  }
  function onLeave() { target.h = 0; }

  parent.addEventListener('pointermove', onMove);
  parent.addEventListener('pointerleave', onLeave);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    uniforms.uTime.value += dt;
    const k = 1 - Math.pow(0.001, dt);
    current.x += (target.x - current.x) * k;
    current.y += (target.y - current.y) * k;
    current.h += (target.h - current.h) * k;
    uniforms.uMouse.value.set(current.x, current.y);
    uniforms.uHover.value = current.h;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return { renderer, scene, camera, uniforms };
}

// ============================================================
// Showcase WebGL — scroll-driven crossfade between multiple images
// ============================================================
export async function initShowcase({ canvas, slides }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x0A0804, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // load all textures
  const textures = [];
  for (const slide of slides) {
    try {
      const t = await loadTexture(slide.img);
      textures.push(t);
    } catch (e) {
      textures.push(null);
    }
  }

  if (textures[0] === null) return null;

  const uniforms = {
    uTexA: { value: textures[0] },
    uTexB: { value: textures[1] || textures[0] },
    uImageSizeA: { value: new THREE.Vector2(textures[0].image.naturalWidth, textures[0].image.naturalHeight) },
    uImageSizeB: { value: new THREE.Vector2((textures[1] || textures[0]).image.naturalWidth, (textures[1] || textures[0]).image.naturalHeight) },
    uMix: { value: 0 },
    uDistort: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 }
  };

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: showcaseVertex,
      fragmentShader: showcaseFragment
    })
  );
  scene.add(mesh);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    uniforms.uResolution.value.set(rect.width, rect.height);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const target = { mix: 0, distort: 0, mx: 0.5, my: 0.5, h: 0 };
  const current = { mix: 0, distort: 0, mx: 0.5, my: 0.5, h: 0 };

  canvas.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    target.mx = (e.clientX - rect.left) / rect.width;
    target.my = 1.0 - (e.clientY - rect.top) / rect.height;
    target.h = 1;
  });
  canvas.addEventListener('pointerleave', () => { target.h = 0; });

  const clock = new THREE.Clock();
  function tick() {
    const dt = clock.getDelta();
    uniforms.uTime.value += dt;
    const k = 1 - Math.pow(0.001, dt);
    current.mix += (target.mix - current.mix) * k;
    current.distort += (target.distort - current.distort) * k;
    current.mx += (target.mx - current.mx) * k;
    current.my += (target.my - current.my) * k;
    current.h += (target.h - current.h) * k;

    uniforms.uMix.value = current.mix;
    uniforms.uDistort.value = current.distort;
    uniforms.uMouse.value.set(current.mx, current.my);
    uniforms.uHover.value = current.h;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // api: pick two slides + blend
  function setFromProgress(globalProgress) {
    // globalProgress: 0..1 through all slides
    const total = slides.length;
    const scaled = globalProgress * (total - 1);
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    const nextIdx = Math.min(idx + 1, total - 1);

    const ta = textures[idx];
    const tb = textures[nextIdx];

    if (ta && tb) {
      if (uniforms.uTexA.value !== ta) {
        uniforms.uTexA.value = ta;
        uniforms.uImageSizeA.value.set(ta.image.naturalWidth, ta.image.naturalHeight);
      }
      if (uniforms.uTexB.value !== tb) {
        uniforms.uTexB.value = tb;
        uniforms.uImageSizeB.value.set(tb.image.naturalWidth, tb.image.naturalHeight);
      }
    }

    target.mix = frac;
    // distortion ramps up during transition, falls off when settled
    const edge = Math.sin(frac * Math.PI);
    target.distort = edge * 0.8;

    return { idx, nextIdx, frac };
  }

  return { renderer, scene, camera, uniforms, setFromProgress };
}
