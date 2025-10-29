import React, { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  AdditiveBlending,
  Points,
  FogExp2,
  Vector3,
  SphereGeometry,
  MeshPhongMaterial,
  Mesh,
  MeshBasicMaterial,
  BackSide,
  LineBasicMaterial,
  Line,
  Color,
  Fog,
  Raycaster
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Apple-grade easing functions for fluid animations
const EASING = {
  // Smooth exit - gentle deceleration
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),

  // Smooth entrance
  easeInCubic: (t) => t * t * t,

  // Breathing - continuous sine wave
  breathe: (t) => Math.sin(t * Math.PI * 2) * 0.5 + 0.5,
};

// Simplified node data for always-on brain (40-60 nodes)
const INITIAL_BRAIN_NODES = [
  // Goals (yellow) - 8 nodes
  { id: 'g1', text: 'Long-term Vision', category: 'Goal', energy: 0.3, weight: 0.7 },
  { id: 'g2', text: 'Growth Strategy', category: 'Goal', energy: 0.28, weight: 0.65 },
  { id: 'g3', text: 'Team Building', category: 'Goal', energy: 0.32, weight: 0.6 },
  { id: 'g4', text: 'Financial Target', category: 'Goal', energy: 0.3, weight: 0.7 },
  { id: 'g5', text: 'Market Position', category: 'Goal', energy: 0.29, weight: 0.55 },
  { id: 'g6', text: 'Product Excellence', category: 'Goal', energy: 0.31, weight: 0.65 },
  { id: 'g7', text: 'Customer Success', category: 'Goal', energy: 0.3, weight: 0.6 },
  { id: 'g8', text: 'Innovation Focus', category: 'Goal', energy: 0.28, weight: 0.55 },
  
  // Ideas (blue) - 14 nodes (largest cluster)
  { id: 'i1', text: 'New Feature Concept', category: 'Idea', energy: 0.3, weight: 0.6 },
  { id: 'i2', text: 'Market Opportunity', category: 'Idea', energy: 0.32, weight: 0.65 },
  { id: 'i3', text: 'Tech Innovation', category: 'Idea', energy: 0.29, weight: 0.55 },
  { id: 'i4', text: 'Partnership Potential', category: 'Idea', energy: 0.31, weight: 0.6 },
  { id: 'i5', text: 'Product Direction', category: 'Idea', energy: 0.3, weight: 0.65 },
  { id: 'i6', text: 'User Experience', category: 'Idea', energy: 0.28, weight: 0.55 },
  { id: 'i7', text: 'Business Model', category: 'Idea', energy: 0.32, weight: 0.7 },
  { id: 'i8', text: 'Platform Design', category: 'Idea', energy: 0.3, weight: 0.6 },
  { id: 'i9', text: 'Integration Strategy', category: 'Idea', energy: 0.29, weight: 0.55 },
  { id: 'i10', text: 'Competitive Edge', category: 'Idea', energy: 0.31, weight: 0.65 },
  { id: 'i11', text: 'Value Proposition', category: 'Idea', energy: 0.3, weight: 0.6 },
  { id: 'i12', text: 'Market Positioning', category: 'Idea', energy: 0.28, weight: 0.55 },
  { id: 'i13', text: 'Customer Insight', category: 'Idea', energy: 0.32, weight: 0.65 },
  { id: 'i14', text: 'Innovation Path', category: 'Idea', energy: 0.3, weight: 0.6 },
  
  // Tasks (orange) - 9 nodes
  { id: 't1', text: 'Planning Phase', category: 'Task', energy: 0.3, weight: 0.6 },
  { id: 't2', text: 'Research Needed', category: 'Task', energy: 0.32, weight: 0.65 },
  { id: 't3', text: 'Implementation', category: 'Task', energy: 0.29, weight: 0.55 },
  { id: 't4', text: 'Testing Required', category: 'Task', energy: 0.31, weight: 0.6 },
  { id: 't5', text: 'Review Process', category: 'Task', energy: 0.3, weight: 0.65 },
  { id: 't6', text: 'Documentation', category: 'Task', energy: 0.28, weight: 0.5 },
  { id: 't7', text: 'Analysis Needed', category: 'Task', energy: 0.32, weight: 0.6 },
  { id: 't8', text: 'Decision Point', category: 'Task', energy: 0.3, weight: 0.65 },
  { id: 't9', text: 'Action Item', category: 'Task', energy: 0.29, weight: 0.55 },
  
  // Emotions (purple) - 5 nodes
  { id: 'e1', text: 'Motivation', category: 'Emotion', energy: 0.3, weight: 0.6 },
  { id: 'e2', text: 'Confidence', category: 'Emotion', energy: 0.32, weight: 0.65 },
  { id: 'e3', text: 'Curiosity', category: 'Emotion', energy: 0.29, weight: 0.55 },
  { id: 'e4', text: 'Determination', category: 'Emotion', energy: 0.31, weight: 0.6 },
  { id: 'e5', text: 'Excitement', category: 'Emotion', energy: 0.3, weight: 0.65 },
  
  // Reflections (cyan) - 5 nodes
  { id: 'r1', text: 'Learning Process', category: 'Reflection', energy: 0.3, weight: 0.6 },
  { id: 'r2', text: 'Pattern Recognition', category: 'Reflection', energy: 0.32, weight: 0.65 },
  { id: 'r3', text: 'Strategic Thinking', category: 'Reflection', energy: 0.29, weight: 0.55 },
  { id: 'r4', text: 'Self Awareness', category: 'Reflection', energy: 0.31, weight: 0.6 },
  { id: 'r5', text: 'Mental Model', category: 'Reflection', energy: 0.3, weight: 0.65 },
  
  // Insights (pale red) - 3 nodes
  { id: 'in1', text: 'Key Realization', category: 'Insight', energy: 0.3, weight: 0.7 },
  { id: 'in2', text: 'Connection Found', category: 'Insight', energy: 0.32, weight: 0.75 },
  { id: 'in3', text: 'Breakthrough Moment', category: 'Insight', energy: 0.31, weight: 0.7 },
  
  // System (green) - 3 nodes
  { id: 's1', text: 'Process Structure', category: 'System', energy: 0.3, weight: 0.65 },
  { id: 's2', text: 'Framework Logic', category: 'System', energy: 0.32, weight: 0.7 },
  { id: 's3', text: 'Meta Cognition', category: 'System', energy: 0.31, weight: 0.65 }
];

// Sparse edge connections (15% density)
const INITIAL_CONNECTIONS = [
  // Key connections between clusters
  { from: 'g1', to: 'i2', strength: 0.3 },
  { from: 'g1', to: 'i5', strength: 0.25 },
  { from: 'g2', to: 't1', strength: 0.3 },
  { from: 'g4', to: 't8', strength: 0.28 },
  { from: 'i1', to: 't2', strength: 0.3 },
  { from: 'i7', to: 'g4', strength: 0.32 },
  { from: 'i10', to: 'i13', strength: 0.25 },
  { from: 't3', to: 't5', strength: 0.3 },
  { from: 'e1', to: 'g1', strength: 0.3 },
  { from: 'e2', to: 'i5', strength: 0.28 },
  { from: 'r1', to: 'r3', strength: 0.3 },
  { from: 'r4', to: 'in1', strength: 0.35 },
  { from: 'in2', to: 'i7', strength: 0.32 },
  { from: 's1', to: 't1', strength: 0.3 },
  { from: 's3', to: 'r4', strength: 0.28 }
];

const COLORS = {
  Goal: '#FFD93D',      // Soft yellow
  Idea: '#4A90E2',      // Professional blue
  Task: '#F5A623',      // Warm orange
  Emotion: '#BD8BFF',   // Soft purple
  Reflection: '#56CCF2', // Light cyan
  Insight: '#EB5757',   // Coral red
  System: '#27AE60'     // Fresh green
};

const VisualBrain = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const nodeObjectsRef = useRef([]);
  const edgeObjectsRef = useRef([]);
  const particlesRef = useRef(null);
  const animationIdRef = useRef(null);

  // Seeded random for consistent positions
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate positions
  const nodePositions = useMemo(() => {
    const positions = {};
    const offsets = {
      'Goal': { x: 8, y: 3, z: 0 },
      'Idea': { x: -8, y: 3, z: 0 },
      'Task': { x: 0, y: -5.5, z: 4 },
      'Emotion': { x: 5.5, y: -3, z: -5.5 },
      'Reflection': { x: -5.5, y: -3, z: -5.5 },
      'Insight': { x: 0, y: 0, z: 0 },
      'System': { x: 0, y: 8, z: 0 }
    };
    
    INITIAL_BRAIN_NODES.forEach((node, idx) => {
      const offset = offsets[node.category];
      const spread = 4;
      const angle = seededRandom(idx * 100) * Math.PI * 2;
      const dist = seededRandom(idx * 101) * spread;
      
      positions[node.id] = {
        x: offset.x + Math.cos(angle) * dist,
        y: offset.y + (seededRandom(idx * 102) - 0.5) * 2.5,
        z: offset.z + Math.sin(angle) * dist
      };
    });
    
    return positions;
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const scene = new Scene();
    scene.background = null; // Transparent for light mode
    sceneRef.current = scene;

    // Use container dimensions instead of window dimensions for proper responsiveness
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(15, 10, 25);
    cameraRef.current = camera;

    const renderer = new WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controlsRef.current = controls;

    // Lighting - Professional setup for light mode
    scene.add(new AmbientLight(0xffffff, 0.8));
    const light1 = new DirectionalLight(0xffffff, 0.6);
    light1.position.set(15, 10, 15);
    scene.add(light1);
    const light2 = new DirectionalLight(0xffffff, 0.3);
    light2.position.set(-15, -10, -15);
    scene.add(light2);

    // Particles (2400 particles - 20% increase for richer spatial effect)
    const particlesGeom = new BufferGeometry();
    const particlePositions = new Float32Array(2400 * 3);
    for(let i = 0; i < 2400 * 3; i++) {
      particlePositions[i] = (seededRandom(i * 50) - 0.5) * 100;
    }
    particlesGeom.setAttribute('position', new BufferAttribute(particlePositions, 3));
    const particlesMat = new PointsMaterial({
      size: 0.06,
      color: 0x2F80FF,
      transparent: true,
      opacity: 0.4,
      blending: AdditiveBlending
    });
    particlesRef.current = new Points(particlesGeom, particlesMat);
    scene.add(particlesRef.current);

    // Fog
    scene.fog = new FogExp2(0x1a1a2e, 0.015);

    // Create nodes
    INITIAL_BRAIN_NODES.forEach(node => {
      createNode(node, scene);
    });

    // Create edges
    INITIAL_CONNECTIONS.forEach(conn => {
      createEdge(conn, scene);
    });

    // Animation loop with breathing
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0003;
      }

      const time = Date.now() * 0.001;

      // Continuous breathing animation (8s cycle - Apple calmness)
      nodeObjectsRef.current.forEach((nodeObj) => {
        // Skip if popping OR flashing
        if (nodeObj.userData.isPopping || nodeObj.userData.isFlashing) {
          return;
        }

        // Slow, deep breath (8 second cycle)
        const breathPhase = time * (Math.PI / 4); // 8s cycle
        const breathScale = 1 + Math.sin(breathPhase) * 0.015; // ±1.5% subtle

        const baseScale = 0.6 + nodeObj.userData.energy * 0.3;
        nodeObj.scale.setScalar(baseScale * breathScale);

        // Gentle emissive pulse
        const phaseOffset = nodeObj.userData.phaseOffset || 0;
        const emissivePhase = Math.sin(breathPhase + phaseOffset) * 0.5 + 0.5;
        nodeObj.material.emissiveIntensity = 0.3 + (emissivePhase * 0.2);

        // Halo breathes
        if (nodeObj.userData.halo) {
          nodeObj.userData.halo.scale.setScalar(baseScale * 1.8 * breathScale);
          nodeObj.userData.halo.material.opacity = 0.1 + (emissivePhase * 0.05);
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // REAL DYNAMIC RESIZE HANDLER with ResizeObserver
    const handleResize = () => {
      if (!canvasRef.current || !container) return;

      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      // Skip if dimensions are invalid
      if (newWidth === 0 || newHeight === 0) return;

      // Update camera aspect ratio
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();

      // Update renderer size
      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Force re-render with new dimensions
      renderer.render(scene, camera);
    };

    // Listen to window resize events
    window.addEventListener('resize', handleResize);

    // Listen to orientation changes on mobile
    window.addEventListener('orientationchange', handleResize);

    // ResizeObserver for REAL dynamic responsiveness
    // This catches container size changes that window.resize might miss
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          handleResize();
        }
      }
    });

    resizeObserver.observe(container);

    // Initial resize call to ensure proper sizing
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  const createNode = (node, scene) => {
    const pos = nodePositions[node.id];
    const position = new Vector3(pos.x, pos.y, pos.z);
    const color = COLORS[node.category];
    
    const size = (0.6 + node.weight * 0.3) * 0.8; // Smaller for low energy
    const geometry = new SphereGeometry(size, 32, 32);
    const material = new MeshPhongMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      emissive: color,
      emissiveIntensity: 0.2,
      shininess: 100
    });
    
    const sphere = new Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.userData = {
      ...node,
      originalEnergy: node.energy,
      phaseOffset: Math.random() * Math.PI * 2 // Random breathing phase
    };
    
    const haloGeom = new SphereGeometry(size * 1.8, 32, 32);
    const haloMat = new MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.1,
      side: BackSide
    });
    const halo = new Mesh(haloGeom, haloMat);
    halo.position.copy(position);
    sphere.userData.halo = halo;
    
    scene.add(sphere);
    scene.add(halo);
    nodeObjectsRef.current.push(sphere);
  };

  const createEdge = (conn, scene) => {
    const fromNode = nodeObjectsRef.current.find(n => n.userData.id === conn.from);
    const toNode = nodeObjectsRef.current.find(n => n.userData.id === conn.to);
    
    if (!fromNode || !toNode) return;
    
    const points = [fromNode.position, toNode.position];
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({
      color: 0x2F80FF,
      transparent: true,
      opacity: 0.2,
      linewidth: 1
    });
    
    const line = new Line(geometry, material);
    scene.add(line);
    edgeObjectsRef.current.push(line);
  };

  // Helper function to apply activations
  const applyActivationsInternal = (activations) => {
    console.log('🎨 applyActivationsInternal called with', activations?.length || 0, 'activations');
    if (!activations || activations.length === 0) return;

    activations.forEach(activation => {
      console.log('🎨 Processing activation for node:', activation.nodeId, 'energyDelta:', activation.energyDelta);
      const nodeObj = nodeObjectsRef.current.find(n => n.userData.id === activation.nodeId);
      if (!nodeObj) {
        console.warn('⚠️ Node not found:', activation.nodeId);
        return;
      }

      // Increase energy (activation effect) - AMPLIFIED for visibility
      const energyIncrease = activation.energyDelta * 3 || 0.5; // 3x stronger
      const newEnergy = Math.min(nodeObj.userData.energy + energyIncrease, 1.0);
      nodeObj.userData.energy = newEnergy;

      console.log('🎨 Animating node:', activation.nodeId, 'energy:', newEnergy, 'emissive:', 1.5 + (newEnergy * 2));

      // ULTRA VISIBLE FLASH: Change entire node to WHITE temporarily
      const originalColor = nodeObj.material.color.getHex();
      const originalEmissive = nodeObj.material.emissive.getHex();

      // Set flag to prevent breathing animation from overriding
      nodeObj.userData.isFlashing = true;

      // FLASH TO PURE WHITE
      nodeObj.material.color.setHex(0xFFFFFF);
      nodeObj.material.emissive.setHex(0xFFFFFF);
      nodeObj.material.emissiveIntensity = 3.0;
      nodeObj.material.opacity = 1.0;
      nodeObj.material.needsUpdate = true;

      // PULSE SCALE UP
      nodeObj.scale.setScalar(2.5); // Grow 2.5x!

      // FLASH halo
      if (nodeObj.userData.halo) {
        nodeObj.userData.halo.material.opacity = 1.0; // Maximum visibility
        nodeObj.userData.halo.scale.setScalar(4.0); // Huge halo!
        nodeObj.userData.halo.material.needsUpdate = true;
      }

      // Return to original after 300ms
      setTimeout(() => {
        nodeObj.material.color.setHex(originalColor);
        nodeObj.material.emissive.setHex(originalEmissive);
        nodeObj.material.emissiveIntensity = 0.3;
        nodeObj.material.opacity = 0.7;
        nodeObj.material.needsUpdate = true;

        // Reset scale to normal
        const baseScale = 0.6 + nodeObj.userData.energy * 0.3;
        nodeObj.scale.setScalar(baseScale);

        if (nodeObj.userData.halo) {
          nodeObj.userData.halo.material.opacity = 0.15;
          nodeObj.userData.halo.scale.setScalar(baseScale * 1.8);
          nodeObj.userData.halo.material.needsUpdate = true;
        }

        // Re-enable breathing animation
        nodeObj.userData.isFlashing = false;
      }, 300);

      // AMPLIFIED pulse effect (2-3x larger)
      const baseScale = 0.6 + nodeObj.userData.weight * 0.3;
      const targetScale = baseScale * (2 + energyIncrease); // Was 1.2-1.5x, now 2-3x

      // Simple tween-like animation
      let pulseProgress = 0;
      const pulseAnimation = setInterval(() => {
        pulseProgress += 0.05;
        if (pulseProgress >= 1) {
          clearInterval(pulseAnimation);
          return;
        }

        // Ease out effect
        const eased = 1 - Math.pow(1 - pulseProgress, 3);
        const currentScale = targetScale + (baseScale - targetScale) * eased;
        nodeObj.scale.setScalar(currentScale);
      }, 16); // ~60fps
    });

    console.log('✅ Applied activations to', activations.length, 'nodes');
  };

  // Popcorn effect: Node pops and STAYS bright for seconds
  const popNode = (node) => {
    if (!node || node.userData.isPopping) return; // Prevent double-pop

    node.userData.isPopping = true;
    node.userData.isFlashing = true; // Disable breathing

    const originalScale = node.userData.baseScale || 0.7;
    const originalEmissiveIntensity = 0.3;

    // CINEMATIC: 50% smaller nodes (7.5% to 12.5% growth, was 15-25%)
    const growthFactor = 0.075 + (Math.random() * 0.05); // 7.5% to 12.5%
    const targetScale = originalScale * (1 + growthFactor);

    // Store for later phases
    node.userData.targetScale = targetScale;
    node.userData.growthFactor = growthFactor;

    console.log('🍿 Node will grow by', Math.round(growthFactor * 100) + '%');

    // PHASE 1: BUILD UP (Pop activation) - 400ms
    let buildProgress = 0;
    const buildDuration = 400;
    const buildStart = Date.now();

    const buildUp = () => {
      const elapsed = Date.now() - buildStart;
      buildProgress = Math.min(elapsed / buildDuration, 1);

      if (buildProgress < 1) {
        const eased = EASING.easeOutCubic(buildProgress);

        // Scale to RANDOMIZED target (not uniform)
        const currentScale = originalScale + ((targetScale - originalScale) * eased);
        node.scale.setScalar(currentScale);

        // Emissive scales with growth factor
        const emissiveTarget = 1.5 + (growthFactor * 2); // Bigger nodes glow more
        node.material.emissiveIntensity = originalEmissiveIntensity + (eased * emissiveTarget);

        // Halo scales proportionally
        if (node.userData.halo) {
          const haloTarget = 0.5 + (growthFactor * 1.0);
          node.userData.halo.material.opacity = 0.15 + (eased * haloTarget);
          node.userData.halo.scale.setScalar(originalScale * (1.8 + eased * (growthFactor * 8)));
          node.userData.halo.material.needsUpdate = true;
        }

        node.material.needsUpdate = true;
        requestAnimationFrame(buildUp);
      } else {
        stayBright();
      }
    };

    // PHASE 2: STAY BRIGHT - FIXED 10 SECONDS (static peak)
    const stayBright = () => {
      // Lock at peak brightness
      node.scale.setScalar(targetScale);

      const emissiveTarget = 1.5 + (growthFactor * 2);
      node.material.emissiveIntensity = emissiveTarget;

      if (node.userData.halo) {
        const haloOpacity = 0.5 + (growthFactor * 1.0);
        node.userData.halo.material.opacity = haloOpacity;
        node.userData.halo.scale.setScalar(originalScale * (1.8 + growthFactor * 8));
        node.userData.halo.material.needsUpdate = true;
      }

      node.material.needsUpdate = true;

      // CINEMATIC: Fixed 10 seconds static hold (no randomization)
      // Creates predictable peak brightness phase
      console.log('🎯 Node will stay static for 10 seconds');

      setTimeout(() => {
        deflate();
      }, 10000); // Exactly 10 seconds
    };

    // PHASE 3: DEFLATE - 15 SECONDS (ultra-smooth decrescendo)
    const deflate = () => {
      console.log('🌙 Starting 15-second gentle fade');

      let deflateProgress = 0;
      const deflateDuration = 15000; // 15 SECONDS (cinematic fade)
      const deflateStart = Date.now();
      const emissiveTarget = 1.5 + (growthFactor * 2);

      const deflateAnim = () => {
        const elapsed = Date.now() - deflateStart;
        deflateProgress = Math.min(elapsed / deflateDuration, 1);

        if (deflateProgress < 1) {
          // Ultra-smooth sine ease out (natural sunset fade)
          const eased = Math.sin(deflateProgress * Math.PI / 2);

          // Scale back to original
          const currentScale = targetScale - ((targetScale - originalScale) * eased);
          node.scale.setScalar(currentScale);

          // Emissive fades
          const currentEmissive = emissiveTarget - ((emissiveTarget - originalEmissiveIntensity) * eased);
          node.material.emissiveIntensity = currentEmissive;

          // Halo deflates
          if (node.userData.halo) {
            const haloOpacity = 0.5 + (growthFactor * 1.0);
            const currentHaloOpacity = haloOpacity - ((haloOpacity - 0.15) * eased);
            const haloScale = originalScale * (1.8 + growthFactor * 8);
            const currentHaloScale = haloScale - ((haloScale - originalScale * 1.8) * eased);

            node.userData.halo.material.opacity = currentHaloOpacity;
            node.userData.halo.scale.setScalar(currentHaloScale);
            node.userData.halo.material.needsUpdate = true;
          }

          node.material.needsUpdate = true;
          requestAnimationFrame(deflateAnim);
        } else {
          // FULLY DEFLATED - return to normal
          node.scale.setScalar(originalScale);
          node.material.emissiveIntensity = originalEmissiveIntensity;

          if (node.userData.halo) {
            node.userData.halo.material.opacity = 0.15;
            node.userData.halo.scale.setScalar(originalScale * 1.8);
            node.userData.halo.material.needsUpdate = true;
          }

          node.material.needsUpdate = true;
          node.userData.isPopping = false;
          node.userData.isFlashing = false;

          console.log('✅ Node returned to normal after 15s fade');
        }
      };

      requestAnimationFrame(deflateAnim);
    };

    // Start Phase 1
    requestAnimationFrame(buildUp);
  };

  // Expose activation method to parent
  useImperativeHandle(ref, () => ({
    // Method for streaming tokens - Popcorn effect
    addToken: (token) => {
      console.log('🎬 Gradual deployment starting for token:', token);

      if (nodeObjectsRef.current.length === 0) {
        return;
      }

      // 15% of nodes per token
      const numToActivate = Math.floor(nodeObjectsRef.current.length * 0.15);
      const activatedIndices = new Set();

      while (activatedIndices.size < numToActivate) {
        const randomIndex = Math.floor(Math.random() * nodeObjectsRef.current.length);
        activatedIndices.add(randomIndex);
      }

      // Sort by distance from center (wave effect)
      const activatedNodes = Array.from(activatedIndices).map(idx => ({
        index: idx,
        node: nodeObjectsRef.current[idx]
      }));

      activatedNodes.sort((a, b) => {
        return a.node.position.length() - b.node.position.length();
      });

      // CINEMATIC CHANGE: Spread activations over 2 seconds per token batch
      // Creates gradual crescendo effect (250-300ms between each node)
      const totalDeploymentTime = 2000; // 2 seconds per token batch
      const staggerDelay = totalDeploymentTime / numToActivate;

      activatedNodes.forEach((item, arrayIndex) => {
        setTimeout(() => {
          popNode(item.node);
        }, arrayIndex * staggerDelay); // ~250-300ms between each (much slower!)
      });

      console.log('✨ Deploying', numToActivate, 'nodes over', totalDeploymentTime / 1000, 'seconds');
    },

    // Method for manual activations (uses same internal function)
    applyActivations: (activations) => {
      applyActivationsInternal(activations);
    }
  }));

  return (
    <div
      className="visual-brain-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none'
        }}
      />
    </div>
  );
});

export default VisualBrain;
