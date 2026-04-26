// Hero centerpiece — real 3D gold coin with PBR material, mouse-reactive tilt
// Uses RoomEnvironment for proper metallic reflections (no HDR file needed)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export async function initCoin3D({ canvas }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);

  // PBR environment — RoomEnvironment provides studio-style reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Coin assembly — group for combined transforms
  const coin = new THREE.Group();
  scene.add(coin);

  // Coin body — cylinder with high segment count for smooth rim
  const bodyGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.10, 96, 1);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xD4A017,
    metalness: 1.0,
    roughness: 0.18,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.6
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2; // face camera
  coin.add(body);

  // Reeded edge — thin torus around the rim suggests milled coin edge
  const rimGeo = new THREE.TorusGeometry(1.255, 0.012, 16, 96);
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xE2C06B,
    metalness: 1.0,
    roughness: 0.32,
    envMapIntensity: 1.4
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  coin.add(rim);

  // Inner face raised disk — gives the face depth, slightly different gold tone
  const faceGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.108, 96, 1);
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xC8A45A,
    metalness: 1.0,
    roughness: 0.38,
    envMapIntensity: 1.0
  });
  const face = new THREE.Mesh(faceGeo, faceMat);
  face.rotation.x = Math.PI / 2;
  coin.add(face);

  // Crown emboss on the face — extruded crown silhouette
  const crownShape = new THREE.Shape();
  // 5-point crown: base rect + 5 triangular peaks
  crownShape.moveTo(-0.42, -0.30);
  crownShape.lineTo(-0.42, -0.10);
  crownShape.lineTo(-0.30, 0.05);
  crownShape.lineTo(-0.21, -0.18);
  crownShape.lineTo(-0.10, 0.12);
  crownShape.lineTo(0.0, -0.20);
  crownShape.lineTo(0.10, 0.12);
  crownShape.lineTo(0.21, -0.18);
  crownShape.lineTo(0.30, 0.05);
  crownShape.lineTo(0.42, -0.10);
  crownShape.lineTo(0.42, -0.30);
  crownShape.closePath();

  const crownGeo = new THREE.ExtrudeGeometry(crownShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.006,
    bevelSize: 0.006,
    bevelSegments: 2
  });
  const crownMat = new THREE.MeshPhysicalMaterial({
    color: 0xE8C97A,
    metalness: 1.0,
    roughness: 0.22,
    envMapIntensity: 1.5
  });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.z = 0.054; // sit on top of front face
  crown.position.y = -0.04;
  coin.add(crown);

  // Tiny orb above crown
  const orbGeo = new THREE.SphereGeometry(0.06, 24, 16);
  const orb = new THREE.Mesh(orbGeo, crownMat);
  orb.position.set(0, 0.32, 0.075);
  coin.add(orb);

  // Lights — gold key + cool fill + ambient base
  const goldKey = new THREE.PointLight(0xFFE5A8, 30, 12, 1.5);
  goldKey.position.set(2.5, 2, 3);
  scene.add(goldKey);

  const coolFill = new THREE.PointLight(0xB8D8FF, 12, 10, 1.5);
  coolFill.position.set(-2.5, -1, 2);
  scene.add(coolFill);

  scene.add(new THREE.AmbientLight(0x444444, 0.4));

  // Resize handling — observe canvas (parent container drives size)
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

  // Mouse-reactive tilt — global pointermove (coin reacts to cursor anywhere)
  let targetTiltX = 0, targetTiltY = 0;
  let currentTiltX = 0, currentTiltY = 0;

  const onMove = e => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    targetTiltY = x * 0.45;
    targetTiltX = y * 0.30;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  // Render loop
  const clock = new THREE.Clock();
  let baseRotY = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Smooth tilt toward mouse target
    currentTiltX += (targetTiltX - currentTiltX) * 0.06;
    currentTiltY += (targetTiltY - currentTiltY) * 0.06;

    // Continuous slow Y rotation + mouse-driven tilt offsets
    baseRotY += dt * 0.35;

    coin.rotation.x = currentTiltX;
    coin.rotation.y = baseRotY + currentTiltY;
    coin.rotation.z = Math.sin(t * 0.4) * 0.04; // gentle drift

    // Floating bob
    coin.position.y = Math.sin(t * 1.1) * 0.06;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return { renderer, scene, coin, dispose: () => {
    window.removeEventListener('pointermove', onMove);
    ro.disconnect();
    renderer.dispose();
  }};
}
