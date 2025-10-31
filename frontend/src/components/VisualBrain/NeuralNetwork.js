import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { nodeShader } from './shaders';

// 7 Node Categories for Emergent aesthetic
const NODE_CATEGORIES = {
  GOAL: 0,       // Soft green #4ade80
  IDEA: 1,       // Soft blue #60a5fa
  TASK: 2,       // Soft yellow #fbbf24
  EMOTION: 3,    // Soft pink #fb7185
  REFLECTION: 4, // Soft purple #a78bfa
  INSIGHT: 5,    // Soft orange #f97316
  SYSTEM: 6      // Soft brown #a16207
};

class Node {
  constructor(position, category = NODE_CATEGORIES.GOAL, clusterId = 0) {
    this.position = position;
    this.connections = [];
    this.category = category;  // Category determines color
    this.clusterId = clusterId; // For organic clustering

    // Organic node sizing: 15-30px with variation
    this.baseSize = THREE.MathUtils.randFloat(2.0, 4.0);
    this.haloSize = this.baseSize * 1.8; // Halo is larger
    this.breathingPhase = Math.random() * Math.PI * 2; // For breathing animation
    this.activationLevel = 0; // 0-1 for visual response
    this.distanceFromRoot = 0;
  }

  addConnection(node, strength = 1.0) {
    if (!this.isConnectedTo(node)) {
      this.connections.push({ node, strength });
      node.connections.push({ node: this, strength });
    }
  }

  isConnectedTo(node) {
    return this.connections.some(conn => conn.node === node);
  }

  // Breathing animation: 6-second cycle
  updateBreathing(elapsedTime) {
    const breatheSpeed = 1.0 / 6.0; // 6 seconds per cycle
    this.breathingPhase = (elapsedTime * breatheSpeed * Math.PI * 2) % (Math.PI * 2);
    // Subtle size variation: 0.9 to 1.1 of base size
    const breatheFactor = 0.95 + 0.05 * Math.sin(this.breathingPhase);
    this.currentSize = this.baseSize * breatheFactor;
    return this.currentSize;
  }

  // Activation triggers when tokens are received
  activate(duration = 1.0) {
    this.activationTime = duration;
  }

  updateActivation(deltaTime) {
    if (this.activationTime > 0) {
      this.activationTime -= deltaTime;
      this.activationLevel = this.activationTime / 1.0; // Fade from 1 to 0
    } else {
      this.activationLevel = 0;
    }
  }
}

export class NeuralNetwork {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.composer = null;
    this.nodesMesh = null;
    this.haloMesh = null;
    this.connectionsMesh = null;
    this.nodes = [];
    this.clusters = {}; // Organize nodes by cluster
    this.animationId = null;
    this.pulseUniforms = {
      uTime: { value: 0.0 },
      uBreathing: { value: 0.0 },
      uActivationMask: { value: [] }, // Per-node activation
      uLightMode: { value: 0 }
    };
    this.config = {
      paused: false,
      isThinking: false,
      maxNodes: 47, // 7 categories × 6 nodes + 5 root nodes
      mode: 'light', // Emergent aesthetic is light by default
      numClusters: 7, // One for each category
      clusterRadius: 12 // Distance from center
    };
    this.clock = new THREE.Clock();
    this.lastTokenTime = 0;
  }

  init() {
    // Emergent aesthetic: Light blue background scene
    this.scene = new THREE.Scene();
    const lightBlueBg = new THREE.Color(0xf0f9ff); // #F0F9FF
    this.scene.background = lightBlueBg;
    this.scene.fog = new THREE.Fog(0xf0f9ff, 80, 200);

    // Camera - slightly elevated for organic perspective
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, 8, 35);

    // Renderer - optimized for organic aesthetic
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf0f9ff);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Controls - gentle interaction
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.35;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 150;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.15; // Slow, smooth rotation
    this.controls.enablePan = false;

    // Post processing - soft bloom for halos
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.8,  // strength - softer for pastel halos
      0.5,  // radius
      0.85  // threshold
    );
    this.composer.addPass(bloomPass);
    this.composer.addPass(new OutputPass());

    // Create organic cluster network
    this.createOrganicNetwork();

    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  createOrganicNetwork() {
    // Remove old meshes
    if (this.nodesMesh) this.scene.remove(this.nodesMesh);
    if (this.haloMesh) this.scene.remove(this.haloMesh);
    if (this.connectionsMesh) this.scene.remove(this.connectionsMesh);

    // Reset nodes and clusters
    this.nodes = [];
    this.clusters = {};

    // Create 7 categorical clusters with organic blob arrangement
    for (let catIdx = 0; catIdx < this.config.numClusters; catIdx++) {
      this.createCategoryCluster(catIdx);
    }

    // Create node geometry
    this.createNodesGeometry();

    // Create soft halo geometry
    this.createHaloGeometry();

    // Create Bezier curved connections
    this.createBezierConnections();
  }

  createCategoryCluster(categoryIdx) {
    // Position each cluster in sphere around center
    const phi = Math.acos(2 * (categoryIdx / this.config.numClusters) - 1);
    const theta = categoryIdx * 2.39996; // Golden angle
    const clusterCenter = new THREE.Vector3(
      this.config.clusterRadius * Math.sin(phi) * Math.cos(theta),
      this.config.clusterRadius * Math.sin(phi) * Math.sin(theta),
      this.config.clusterRadius * Math.cos(phi)
    );

    this.clusters[categoryIdx] = {
      center: clusterCenter,
      nodes: [],
      category: categoryIdx,
      color: this.getCategoryColor(categoryIdx)
    };

    // Create 6-7 nodes per cluster in organic blob pattern
    const nodesPerCluster = 6 + Math.floor(Math.random() * 2);
    for (let i = 0; i < nodesPerCluster; i++) {
      const angle = (i / nodesPerCluster) * Math.PI * 2;
      const radius = 3 + Math.random() * 2;
      const phi2 = Math.acos(2 * Math.random() - 1);

      const localPos = new THREE.Vector3(
        radius * Math.sin(phi2) * Math.cos(angle),
        radius * Math.sin(phi2) * Math.sin(angle),
        radius * Math.cos(phi2)
      );

      const worldPos = clusterCenter.clone().add(localPos);
      const node = new Node(worldPos, categoryIdx, categoryIdx);
      node.distanceFromRoot = clusterCenter.length();
      node.clusterId = categoryIdx;

      this.nodes.push(node);
      this.clusters[categoryIdx].nodes.push(node);

      // Connect within cluster
      if (i > 0) {
        const prevNode = this.clusters[categoryIdx].nodes[i - 1];
        node.addConnection(prevNode, 0.8);
      }
    }
  }

  getCategoryColor(categoryIdx) {
    const colors = [
      new THREE.Color(0x4ade80), // Green - GOAL
      new THREE.Color(0x60a5fa), // Blue - IDEA
      new THREE.Color(0xfbbf24), // Yellow - TASK
      new THREE.Color(0xfb7185), // Pink - EMOTION
      new THREE.Color(0xa78bfa), // Purple - REFLECTION
      new THREE.Color(0xf97316), // Orange - INSIGHT
      new THREE.Color(0xa16207)  // Brown - SYSTEM
    ];
    return colors[categoryIdx % colors.length];
  }


  createNodesGeometry() {
    const positions = [];
    const sizes = [];
    const colors = [];
    const activations = [];

    for (const node of this.nodes) {
      positions.push(node.position.x, node.position.y, node.position.z);
      sizes.push(node.baseSize * 2.5); // Scale up for visibility (15-30px range)

      // Get category color
      const color = this.getCategoryColor(node.category);
      colors.push(color.r, color.g, color.b);

      // Activation level for visual response
      activations.push(node.activationLevel);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
    geo.setAttribute('nodeColor', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geo.setAttribute('activation', new THREE.BufferAttribute(new Float32Array(activations), 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: this.pulseUniforms,
      vertexShader: nodeShader.vertexShader,
      fragmentShader: nodeShader.fragmentShader,
      transparent: true,
      depthWrite: false
    });

    this.nodesMesh = new THREE.Points(geo, mat);
    this.scene.add(this.nodesMesh);
  }

  createHaloGeometry() {
    const positions = [];
    const sizes = [];
    const colors = [];

    for (const node of this.nodes) {
      positions.push(node.position.x, node.position.y, node.position.z);
      // Halo is larger and softer
      sizes.push(node.haloSize * 2.5);

      // Halo color: slightly desaturated version of node color
      const color = this.getCategoryColor(node.category);
      colors.push(color.r * 0.9, color.g * 0.9, color.b * 0.9);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
    geo.setAttribute('nodeColor', new THREE.BufferAttribute(new Float32Array(colors), 3));

    // Halo material - soft glow
    const mat = new THREE.ShaderMaterial({
      uniforms: this.pulseUniforms,
      vertexShader: `
        uniform float uTime;
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 xy = gl_PointCoord - vec2(0.5);
          float ll = length(xy);
          float alpha = (1.0 - ll * ll) * 0.3; // Soft falloff
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false
    });

    this.haloMesh = new THREE.Points(geo, mat);
    this.scene.add(this.haloMesh);
  }

  createBezierConnections() {
    const lines = [];
    const processedPairs = new Set();

    for (const node of this.nodes) {
      for (const conn of node.connections) {
        const otherIdx = this.nodes.indexOf(conn.node);
        const thisIdx = this.nodes.indexOf(node);

        // Only process each pair once
        const pairKey = [Math.min(thisIdx, otherIdx), Math.max(thisIdx, otherIdx)].join('-');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        // Create Bezier curve
        const startPos = node.position;
        const endPos = conn.node.position;

        // Control point: midpoint with slight curve
        const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
        const dir = new THREE.Vector3().subVectors(endPos, startPos);
        const perpendicular = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        const controlPoint = midpoint.clone().add(perpendicular.multiplyScalar(2));

        // Sample Bezier curve
        const segments = 20;
        const curvePoints = [];
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          // Quadratic Bezier: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
          const p0 = new THREE.Vector3().copy(startPos).multiplyScalar(Math.pow(1 - t, 2));
          const p1 = new THREE.Vector3().copy(controlPoint).multiplyScalar(2 * (1 - t) * t);
          const p2 = new THREE.Vector3().copy(endPos).multiplyScalar(t * t);
          const point = new THREE.Vector3().addVectors(p0, p1).add(p2);
          curvePoints.push(point);
        }

        // Create line geometry
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

        // Average of category colors for connection
        const color1 = this.getCategoryColor(node.category);
        const color2 = this.getCategoryColor(conn.node.category);
        const avgColor = new THREE.Color(
          (color1.r + color2.r) * 0.5,
          (color1.g + color2.g) * 0.5,
          (color1.b + color2.b) * 0.5
        );

        const lineMat = new THREE.LineBasicMaterial({
          color: avgColor,
          transparent: true,
          opacity: conn.strength * 0.6,
          linewidth: 1.5
        });

        const line = new THREE.Line(lineGeo, lineMat);
        this.scene.add(line);
        lines.push(line);
      }
    }

    this.connectionLines = lines;
  }

  addNode() {
    // Add a new node for streaming tokens
    if (this.nodes.length === 0) return;

    // Remove oldest node if at max (rolling window)
    if (this.nodes.length >= this.config.maxNodes) {
      const nodeToRemove = this.nodes[0];
      // Remove connections
      for (const node of this.nodes) {
        node.connections = node.connections.filter(conn => conn.node !== nodeToRemove);
      }
      this.nodes.shift();
    }

    // Pick a random cluster to add node to (weighted towards active categories)
    const randomCategory = Math.floor(Math.random() * this.config.numClusters);
    const cluster = this.clusters[randomCategory];

    if (!cluster) return;

    // Add node near cluster center with organic offset
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const offset = new THREE.Vector3(
      radius * Math.sin(phi) * Math.cos(angle),
      radius * Math.sin(phi) * Math.sin(angle),
      radius * Math.cos(phi)
    );

    const newPos = cluster.center.clone().add(offset);
    const newNode = new Node(newPos, randomCategory, randomCategory);
    newNode.activate(1.0); // 1 second activation pulse
    newNode.distanceFromRoot = cluster.center.length();

    this.nodes.push(newNode);
    cluster.nodes.push(newNode);

    // Connect to nearby cluster nodes
    if (cluster.nodes.length > 1) {
      const nearestNode = cluster.nodes[cluster.nodes.length - 2];
      newNode.addConnection(nearestNode, 0.8);
    }

    // Regenerate geometries
    this.scene.remove(this.nodesMesh);
    if (this.haloMesh) this.scene.remove(this.haloMesh);

    // Remove old connection lines
    if (this.connectionLines) {
      for (const line of this.connectionLines) {
        this.scene.remove(line);
      }
    }

    this.createNodesGeometry();
    this.createHaloGeometry();
    this.createBezierConnections();
  }

  // Cinematic token-triggered animation system
  addToken(token) {
    console.log('🎬 Gradual 15-second deployment starting');

    if (!this.nodesMesh || this.nodes.length === 0) return;

    // Calculate number of nodes to activate (15% of total)
    const numToActivate = Math.floor(this.nodes.length * 0.15);
    const activatedIndices = new Set();

    // Randomly select nodes to activate
    while (activatedIndices.size < numToActivate) {
      activatedIndices.add(Math.floor(Math.random() * this.nodes.length));
    }

    const activatedNodes = Array.from(activatedIndices).map(idx => ({
      index: idx,
      node: this.nodes[idx]
    }));

    // Sort by distance from center (wave from inside out)
    activatedNodes.sort((a, b) => {
      return a.node.position.length() - b.node.position.length();
    });

    // CINEMATIC TIMING: Spread over 15 SECONDS
    const totalDeploymentTime = 15000; // 15 SECONDS
    const staggerDelay = totalDeploymentTime / numToActivate;

    console.log(`✨ Will deploy ${numToActivate} nodes over ${totalDeploymentTime / 1000}s (${Math.round(staggerDelay)}ms between each)`);

    activatedNodes.forEach((item, arrayIndex) => {
      setTimeout(() => {
        this.popNode(item.index);
        console.log(`🍿 Node ${arrayIndex + 1}/${numToActivate} popped at ${arrayIndex * staggerDelay}ms`);
      }, arrayIndex * staggerDelay);
    });
  }

  popNode(nodeIndex) {
    if (nodeIndex >= this.nodes.length) return;

    const node = this.nodes[nodeIndex];
    if (node.userData?.isPopping) return;

    // Mark as popping
    if (!node.userData) node.userData = {};
    node.userData.isPopping = true;
    node.userData.isFlashing = true;

    // Store original values
    const originalScale = node.baseSize;
    node.userData.originalScale = originalScale;

    // REDUCED GROWTH: 7.5% to 12.5% (half of previous 15-25%)
    const growthFactor = 0.075 + (Math.random() * 0.05);
    const targetScale = originalScale * (1 + growthFactor);

    console.log(`💥 Node ${nodeIndex} popping with ${(growthFactor * 100).toFixed(1)}% growth`);

    // PHASE 1: Quick pop-up (500ms)
    let popProgress = 0;
    const popDuration = 500;
    const popStart = Date.now();

    const popAnim = () => {
      const elapsed = Date.now() - popStart;
      popProgress = Math.min(elapsed / popDuration, 1);

      if (popProgress < 1) {
        // Elastic ease-out for pop
        const eased = 1 - Math.pow(1 - popProgress, 3);
        node.baseSize = originalScale + ((targetScale - originalScale) * eased);
        requestAnimationFrame(popAnim);
      } else {
        // Pop complete, move to static phase
        node.baseSize = targetScale;
        this.stayBright(node, nodeIndex, originalScale, targetScale, growthFactor);
      }
    };

    requestAnimationFrame(popAnim);
  }

  stayBright(node, nodeIndex, originalScale, targetScale, growthFactor) {
    console.log(`🌟 Node ${nodeIndex} staying bright for 10s`);

    // FIXED: 10 seconds (no randomization)
    setTimeout(() => {
      this.deflateNode(node, nodeIndex, originalScale, targetScale, growthFactor);
    }, 10000); // Exactly 10 seconds
  }

  deflateNode(node, nodeIndex, originalScale, targetScale, growthFactor) {
    console.log(`🌙 Node ${nodeIndex} starting 15-second gentle fade`);

    let deflateProgress = 0;
    const deflateDuration = 15000; // 15 SECONDS (was 10s)
    const deflateStart = Date.now();

    const deflateAnim = () => {
      const elapsed = Date.now() - deflateStart;
      deflateProgress = Math.min(elapsed / deflateDuration, 1);

      if (deflateProgress < 1) {
        // Ultra-smooth sine ease for gentle fade
        const eased = Math.sin(deflateProgress * Math.PI / 2);

        // Gradually return to original size
        const currentScale = targetScale - ((targetScale - originalScale) * eased);
        node.baseSize = currentScale;

        requestAnimationFrame(deflateAnim);
      } else {
        // FULLY DEFLATED
        node.baseSize = originalScale;

        if (node.userData) {
          node.userData.isPopping = false;
          node.userData.isFlashing = false;
        }

        console.log(`✅ Node ${nodeIndex} returned to normal after 15s fade`);
      }
    };

    requestAnimationFrame(deflateAnim);
  }

  // Trigger pulse for general activity
  triggerPulse() {
    // Use addToken for cinematic effect
    this.addToken('pulse');
  }

  togglePause() {
    this.config.paused = !this.config.paused;
    this.controls.autoRotate = !this.config.paused;
  }

  setThinkingState(isThinking) {
    this.config.isThinking = isThinking;
    if (isThinking) {
      this.controls.autoRotateSpeed = 0.25; // Slightly faster during thinking
    } else {
      this.controls.autoRotateSpeed = 0.15; // Normal speed
    }
  }

  resetCamera() {
    this.camera.position.set(0, 8, 35);
    this.controls.target.set(0, 0, 0);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    if (!this.config.paused) {
      this.controls.update();
    }

    const time = this.clock.getElapsedTime();
    const deltaTime = this.clock.getDelta();

    this.pulseUniforms.uTime.value = time;
    this.pulseUniforms.uBreathing.value = Math.sin(time * Math.PI / 3); // 6-second breathing cycle

    // Update breathing animation and activation for all nodes
    for (const node of this.nodes) {
      node.updateBreathing(time);
      node.updateActivation(deltaTime);
    }

    this.composer.render();
  };

  updateMode() {
    // Emergent aesthetic is optimized for light mode only
    this.config.mode = 'light';
    this.pulseUniforms.uLightMode.value = 1;
    console.log('✨ Organic aesthetic - light mode enabled');
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', () => this.onWindowResize());
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
