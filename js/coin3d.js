// Hero centerpiece — full cinematic 3D scene with coin + particles + scroll-driven camera
// Designed to dominate the viewport, not sit in a sidebar.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function initCoin3D({ canvas, onReady }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 3.6);

  // PBR environment via PMREM
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // ── COIN ASSEMBLY ─────────────────────────────────────────────────────────
  const coin = new THREE.Group();
  scene.add(coin);

  // Body — high segment count
  const bodyGeo = new THREE.CylinderGeometry(1.30, 1.30, 0.10, 128, 1);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A017,
    metalness: 1.0,
    roughness: 0.16,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1.7
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2;
  coin.add(body);

  // Reeded edge torus
  const rimGeo = new THREE.TorusGeometry(1.305, 0.013, 16, 128);
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xE8C97A,
    metalness: 1.0,
    roughness: 0.30,
    envMapIntensity: 1.5
  });
  coin.add(new THREE.Mesh(rimGeo, rimMat));

  // Inner raised face
  const faceGeo = new THREE.CylinderGeometry(1.10, 1.10, 0.108, 128, 1);
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xC8A45A,
    metalness: 1.0,
    roughness: 0.36,
    envMapIntensity: 1.1
  });
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.rotation.x = Math.PI / 2;
  coin.add(face);

  // Crown emboss — extruded shape
  const crown = new THREE.Shape();
  crown.moveTo(-0.46, -0.32); crown.lineTo(-0.46, -0.10);
  crown.lineTo(-0.32, 0.06);  crown.lineTo(-0.22, -0.20);
  crown.lineTo(-0.10, 0.14);  crown.lineTo(0.0, -0.22);
  crown.lineTo(0.10, 0.14);   crown.lineTo(0.22, -0.20);
  crown.lineTo(0.32, 0.06);   crown.lineTo(0.46, -0.10);
  crown.lineTo(0.46, -0.32);  crown.closePath();

  const crownGeo = new THREE.ExtrudeGeometry(crown, {
    depth: 0.030, bevelEnabled: true,
    bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3
  });
  const crownMat = new THREE.MeshPhysicalMaterial({
    color: 0xF0CD7E,
    metalness: 1.0,
    roughness: 0.20,
    envMapIntensity: 1.6
  });
  const crownMesh = new THREE.Mesh(crownGeo, crownMat);
  crownMesh.position.set(0, -0.04, 0.054);
  coin.add(crownMesh);

  // Orb above crown
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 24), crownMat);
  orb.position.set(0, 0.34, 0.082);
  coin.add(orb);

  // ── PARTICLE FIELD — gold dust ─────────────────────────────────────────────
  const particleCount = 420;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  const phases = new Float32Array(particleCount);
  const sizes = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Distribute in a 3D cylinder around the coin
    const r = 1.6 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3]     = Math.cos(theta) * r * (0.35 + Math.random() * 0.65);
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
    positions[i * 3 + 2] = Math.sin(theta) * r * 0.4 - 1.5;
    speeds[i]  = 0.08 + Math.random() * 0.20;
    phases[i]  = Math.random() * Math.PI * 2;
    sizes[i]   = 0.5 + Math.random() * 2.5;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  // Custom particle material — soft round gold dots
  const particleMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xE8C97A) }
    },
    vertexShader: /* glsl */`
      attribute float size;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 pos = position;
        // gentle horizontal drift + sparkle
        pos.x += sin(uTime * 0.4 + position.y * 0.6) * 0.06;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = size * (300.0 / -mvPos.z);
        // depth-based alpha — closer particles brighter
        vAlpha = clamp(1.0 - (-mvPos.z - 1.0) / 6.0, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision mediump float;
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.85;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ── ATMOSPHERIC HALO BEHIND COIN ──────────────────────────────────────────
  const haloGeo = new THREE.PlaneGeometry(8, 8);
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision mediump float;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        float d = distance(vUv, vec2(0.5));
        float pulse = 0.5 + 0.5 * sin(uTime * 0.5);
        float intensity = smoothstep(0.45, 0.0, d) * (0.18 + 0.06 * pulse);
        vec3 col = mix(vec3(0.886, 0.753, 0.420), vec3(1.0, 0.9, 0.7), pulse);
        gl_FragColor = vec4(col, intensity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.z = -0.5;
  scene.add(halo);

  // ── LIGHTING ──────────────────────────────────────────────────────────────
  const goldKey = new THREE.PointLight(0xFFE5A8, 80, 12, 1.5);
  goldKey.position.set(2.8, 2.2, 3.2);
  scene.add(goldKey);

  const coolFill = new THREE.PointLight(0xB8D8FF, 25, 12, 1.5);
  coolFill.position.set(-2.8, -1.2, 2.5);
  scene.add(coolFill);

  const rimLight = new THREE.PointLight(0xFFAA44, 18, 8, 2);
  rimLight.position.set(0, -3, -2);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0x554433, 0.5));

  // ── SIZING ────────────────────────────────────────────────────────────────
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // ── INTERACTION ───────────────────────────────────────────────────────────
  let targetTiltX = 0, targetTiltY = 0;
  let currentTiltX = 0, currentTiltY = 0;

  const onMove = e => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    targetTiltY = x * 0.55;
    targetTiltX = y * 0.35;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // Scroll-driven camera + coin scale
  let scrollProgress = 0;
  const onScroll = () => {
    const heroEl = document.querySelector('.hero');
    if (!heroEl) return;
    const rect = heroEl.getBoundingClientRect();
    // 0 at hero top, 1 when hero scrolled fully out of view
    scrollProgress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── RENDER LOOP ───────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let baseRotY = 0;
  let revealT = 0;

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Reveal animation — coin scales up from 0 over 1.5s
    revealT = Math.min(1, revealT + dt / 1.4);
    const eased = 1 - Math.pow(1 - revealT, 4);

    // Smooth tilt
    currentTiltX += (targetTiltX - currentTiltX) * 0.06;
    currentTiltY += (targetTiltY - currentTiltY) * 0.06;

    // Continuous Y rotation
    baseRotY += dt * 0.32;

    // Scroll: coin shrinks slightly + drifts up + speeds rotation
    const sp = scrollProgress;
    const scrollScale = 1.0 - sp * 0.15;
    const scrollY = sp * 1.2;
    const scrollRot = sp * 1.5;

    coin.rotation.x = currentTiltX;
    coin.rotation.y = baseRotY + currentTiltY + scrollRot;
    coin.rotation.z = Math.sin(t * 0.4) * 0.04;
    coin.scale.setScalar(eased * scrollScale);
    coin.position.y = Math.sin(t * 1.0) * 0.05 + scrollY;
    coin.position.z = -sp * 0.5; // slight push back on scroll

    // Halo pulse behind
    halo.scale.setScalar(1 + sp * 0.3);
    haloMat.uniforms.uTime.value = t;

    // Particles drift up
    const posAttr = particleGeo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      let y = posAttr.array[i * 3 + 1];
      y += speeds[i] * dt;
      if (y > 3.5) y = -3.5;
      posAttr.array[i * 3 + 1] = y;
    }
    posAttr.needsUpdate = true;
    particleMat.uniforms.uTime.value = t;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // Signal ready (for preloader to dismiss)
  if (onReady) requestAnimationFrame(() => onReady());

  return {
    renderer, scene, coin,
    dispose: () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      renderer.dispose();
    }
  };
}
