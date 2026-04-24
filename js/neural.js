// Neural field — animated point cloud + connecting edges
// Ported (in spirit) from brandivibe.com/neuron NeuralField component
// ATELIER palette: gold/cream on deep ink

import * as THREE from 'three';

export function createNeuralField({ canvas, nodeCount = 48, linkThreshold = 2.2, palette }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Generate nodes
  const basePositions = new Float32Array(nodeCount * 3);
  for (let i = 0; i < nodeCount; i++) {
    basePositions[i * 3 + 0] = (Math.random() - 0.5) * 6;
    basePositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
    basePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }
  const currentPositions = new Float32Array(basePositions);

  // Build edges by proximity
  const connections = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dx = basePositions[i * 3] - basePositions[j * 3];
      const dy = basePositions[i * 3 + 1] - basePositions[j * 3 + 1];
      const dz = basePositions[i * 3 + 2] - basePositions[j * 3 + 2];
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < linkThreshold) {
        connections.push([i, j]);
      }
    }
  }
  const linePositions = new Float32Array(connections.length * 6);

  // Points
  const pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.07,
    color: palette.point,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    depthWrite: false
  });
  const points = new THREE.Points(pGeom, pMat);
  scene.add(points);

  // Lines
  const lGeom = new THREE.BufferGeometry();
  lGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lMat = new THREE.LineBasicMaterial({
    color: palette.line,
    transparent: true,
    opacity: 0.15,
    depthWrite: false
  });
  const lines = new THREE.LineSegments(lGeom, lMat);
  scene.add(lines);

  const group = new THREE.Group();
  group.add(points);
  group.add(lines);
  scene.add(group);

  // Global opacity for fade out
  const state = { opacity: 1, spin: 0.04, scale: 1 };

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

  const clock = new THREE.Clock();
  let raf;
  function tick() {
    const t = clock.getElapsedTime();

    // Breathing node positions
    for (let i = 0; i < nodeCount; i++) {
      currentPositions[i * 3 + 0] = basePositions[i * 3 + 0] + Math.sin(t * 0.5 + i) * 0.15;
      currentPositions[i * 3 + 1] = basePositions[i * 3 + 1] + Math.cos(t * 0.4 + i * 0.5) * 0.12;
      currentPositions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(t * 0.3 + i * 0.7) * 0.10;
    }
    pGeom.attributes.position.needsUpdate = true;

    // Update edge endpoints to breathe with nodes
    for (let k = 0; k < connections.length; k++) {
      const [a, b] = connections[k];
      linePositions[k * 6 + 0] = currentPositions[a * 3 + 0];
      linePositions[k * 6 + 1] = currentPositions[a * 3 + 1];
      linePositions[k * 6 + 2] = currentPositions[a * 3 + 2];
      linePositions[k * 6 + 3] = currentPositions[b * 3 + 0];
      linePositions[k * 6 + 4] = currentPositions[b * 3 + 1];
      linePositions[k * 6 + 5] = currentPositions[b * 3 + 2];
    }
    lGeom.attributes.position.needsUpdate = true;

    group.rotation.y = t * state.spin;
    group.rotation.x = Math.sin(t * 0.15) * 0.08;
    group.scale.setScalar(state.scale);

    pMat.opacity = 0.95 * state.opacity;
    lMat.opacity = 0.22 * state.opacity;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  return {
    state,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      pGeom.dispose();
      lGeom.dispose();
      pMat.dispose();
      lMat.dispose();
    }
  };
}
