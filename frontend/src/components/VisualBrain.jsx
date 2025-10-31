import React, { useRef, useEffect, useMemo, forwardRef, useImperativeHandle, useState } from 'react';
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

  // Elastic bounce - organic life
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

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

  // Ideas (blue) - 12 nodes (REDUCED from 14 - balanced cluster)
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

  // Tasks (orange) - 6 nodes (REDUCED from 9 - less dominant)
  { id: 't1', text: 'Planning Phase', category: 'Task', energy: 0.3, weight: 0.6 },
  { id: 't2', text: 'Research Needed', category: 'Task', energy: 0.32, weight: 0.65 },
  { id: 't3', text: 'Implementation', category: 'Task', energy: 0.29, weight: 0.55 },
  { id: 't4', text: 'Testing Required', category: 'Task', energy: 0.31, weight: 0.6 },
  { id: 't5', text: 'Review Process', category: 'Task', energy: 0.3, weight: 0.65 },
  { id: 't6', text: 'Documentation', category: 'Task', energy: 0.28, weight: 0.5 },

  // Emotions (purple) - 7 nodes (INCREASED from 5 - emotional depth)
  { id: 'e1', text: 'Motivation', category: 'Emotion', energy: 0.3, weight: 0.6 },
  { id: 'e2', text: 'Confidence', category: 'Emotion', energy: 0.32, weight: 0.65 },
  { id: 'e3', text: 'Curiosity', category: 'Emotion', energy: 0.29, weight: 0.55 },
  { id: 'e4', text: 'Determination', category: 'Emotion', energy: 0.31, weight: 0.6 },
  { id: 'e5', text: 'Excitement', category: 'Emotion', energy: 0.3, weight: 0.65 },
  { id: 'e6', text: 'Inspiration', category: 'Emotion', energy: 0.32, weight: 0.7 },
  { id: 'e7', text: 'Wonder', category: 'Emotion', energy: 0.29, weight: 0.6 },

  // Reflections (cyan) - 6 nodes (INCREASED from 5 - thoughtful presence)
  { id: 'r1', text: 'Learning Process', category: 'Reflection', energy: 0.3, weight: 0.6 },
  { id: 'r2', text: 'Pattern Recognition', category: 'Reflection', energy: 0.32, weight: 0.65 },
  { id: 'r3', text: 'Strategic Thinking', category: 'Reflection', energy: 0.29, weight: 0.55 },
  { id: 'r4', text: 'Self Awareness', category: 'Reflection', energy: 0.31, weight: 0.6 },
  { id: 'r5', text: 'Mental Model', category: 'Reflection', energy: 0.3, weight: 0.65 },
  { id: 'r6', text: 'Deep Understanding', category: 'Reflection', energy: 0.32, weight: 0.7 },

  // Insights (red) - 6 nodes (INCREASED from 3 - precious discoveries!)
  { id: 'in1', text: 'Key Realization', category: 'Insight', energy: 0.3, weight: 0.7 },
  { id: 'in2', text: 'Connection Found', category: 'Insight', energy: 0.32, weight: 0.75 },
  { id: 'in3', text: 'Breakthrough Moment', category: 'Insight', energy: 0.31, weight: 0.7 },
  { id: 'in4', text: 'Aha Moment', category: 'Insight', energy: 0.33, weight: 0.8 },
  { id: 'in5', text: 'Hidden Pattern', category: 'Insight', energy: 0.3, weight: 0.75 },
  { id: 'in6', text: 'Creative Leap', category: 'Insight', energy: 0.32, weight: 0.7 },

  // System (green) - 5 nodes (INCREASED from 3 - structural foundation)
  { id: 's1', text: 'Process Structure', category: 'System', energy: 0.3, weight: 0.65 },
  { id: 's2', text: 'Framework Logic', category: 'System', energy: 0.32, weight: 0.7 },
  { id: 's3', text: 'Meta Cognition', category: 'System', energy: 0.31, weight: 0.65 },
  { id: 's4', text: 'System Design', category: 'System', energy: 0.3, weight: 0.7 },
  { id: 's5', text: 'Architecture View', category: 'System', energy: 0.32, weight: 0.65 }
];

// Sparse edge connections (15% density)
// ⚠️ FIXED: Removed references to non-existent nodes (t8, i13)
const INITIAL_CONNECTIONS = [
  // Key connections between clusters
  { from: 'g1', to: 'i2', strength: 0.3 },
  { from: 'g1', to: 'i5', strength: 0.25 },
  { from: 'g2', to: 't1', strength: 0.3 },
  { from: 'g4', to: 't6', strength: 0.28 }, // ✅ FIXED: t8 → t6 (t8 doesn't exist)
  { from: 'i1', to: 't2', strength: 0.3 },
  { from: 'i7', to: 'g4', strength: 0.32 },
  { from: 'i10', to: 'i12', strength: 0.25 }, // ✅ FIXED: i13 → i12 (i13 doesn't exist)
  { from: 't3', to: 't5', strength: 0.3 },
  { from: 'e1', to: 'g1', strength: 0.3 },
  { from: 'e2', to: 'i5', strength: 0.28 },
  { from: 'r1', to: 'r3', strength: 0.3 },
  { from: 'r4', to: 'in1', strength: 0.35 },
  { from: 'in2', to: 'i7', strength: 0.32 },
  { from: 's1', to: 't1', strength: 0.3 },
  { from: 's3', to: 'r4', strength: 0.28 }
];

// Updated colors for Visual Brain node types (from backend schema)
const COLORS = {
  GOAL: '#F59E0B',      // Amber/Orange - Ambition, vision
  IDEA: '#3B82F6',      // Blue - Exploration, concepts
  TASK: '#10B981',      // Green - Action, practical steps
  QUESTION: '#06B6D4',  // Cyan - Uncertainty, choices
  INSIGHT: '#EF4444',   // Red - Realization, breakthrough

  // Legacy support (for mock nodes during transition)
  Goal: '#F59E0B',
  Idea: '#3B82F6',
  Task: '#10B981',
  Emotion: '#BD8BFF',
  Reflection: '#06B6D4',
  Insight: '#EF4444',
  System: '#10B981'
};

const VisualBrain = forwardRef(({ nodes = [], edges = [], isThinking, onNodeClick }, ref) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const nodeObjectsRef = useRef([]);
  const edgeObjectsRef = useRef([]);
  const particlesRef = useRef(null);
  const animationIdRef = useRef(null);

  // State for managing brain nodes (real data from backend)
  const [brainNodes, setBrainNodes] = useState(INITIAL_BRAIN_NODES); // Start with mock
  const [brainEdges, setBrainEdges] = useState(INITIAL_CONNECTIONS);

  // Sync props with state - use real data when available
  useEffect(() => {
    if (nodes.length > 0) {
      console.log('🧠 Visual Brain: Received', nodes.length, 'real nodes from backend');

      // Map backend nodes to Visual Brain format
      const mappedNodes = nodes.map(node => ({
        id: node.id,
        text: node.label,
        category: node.type, // GOAL, IDEA, TASK, QUESTION, INSIGHT
        energy: node.energy,
        weight: node.energy // Use energy as weight for size
      }));

      setBrainNodes(mappedNodes);
    }
  }, [nodes]);

  useEffect(() => {
    if (edges.length > 0) {
      console.log('🧠 Visual Brain: Received', edges.length, 'real edges from backend');

      // Map backend edges to Visual Brain format
      const mappedEdges = edges.map(edge => ({
        from: edge.from_node_id,
        to: edge.to_node_id,
        strength: edge.strength
      }));

      setBrainEdges(mappedEdges);
    }
  }, [edges]);

  // Seeded random for consistent positions
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate positions (dynamically based on brainNodes)
  const nodePositions = useMemo(() => {
    const positions = {};
    const offsets = {
      // New Visual Brain types
      'GOAL': { x: 0, y: 8, z: 0 },        // Top - high-level ambitions
      'IDEA': { x: -8, y: 3, z: 0 },       // Left - creative exploration
      'TASK': { x: -5.5, y: -3, z: -5.5 }, // Bottom-left - action items
      'QUESTION': { x: 5.5, y: -3, z: -5.5 }, // Bottom-right - scattered uncertainty
      'INSIGHT': { x: 8, y: 3, z: 0 },     // Right - breakthrough moments

      // Legacy support (for mock nodes during transition)
      'Goal': { x: 8, y: 3, z: 0 },
      'Idea': { x: -8, y: 3, z: 0 },
      'Task': { x: 0, y: -5.5, z: 4 },
      'Emotion': { x: 5.5, y: -3, z: -5.5 },
      'Reflection': { x: -5.5, y: -3, z: -5.5 },
      'Insight': { x: 0, y: 0, z: 0 },
      'System': { x: 0, y: 8, z: 0 }
    };

    brainNodes.forEach((node, idx) => {
      const offset = offsets[node.category] || { x: 0, y: 0, z: 0 };
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
  }, [brainNodes]);

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
    for (let i = 0; i < 2400 * 3; i++) {
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

    // Create nodes (using dynamic brainNodes)
    brainNodes.forEach(node => {
      createNode(node, scene);
    });

    // Create edges (using dynamic brainEdges)
    brainEdges.forEach(conn => {
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

      // Clean up node and edge objects
      nodeObjectsRef.current.forEach(node => {
        if (node.userData.halo) {
          scene.remove(node.userData.halo);
          node.userData.halo.geometry?.dispose();
          node.userData.halo.material?.dispose();
        }
        scene.remove(node);
        node.geometry?.dispose();
        node.material?.dispose();
      });
      edgeObjectsRef.current.forEach(edge => {
        scene.remove(edge);
        edge.geometry?.dispose();
        edge.material?.dispose();
      });
      nodeObjectsRef.current = [];
      edgeObjectsRef.current = [];
    };
  }, [brainNodes, brainEdges, nodePositions]);

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

  // 🍿 POPCORN EFFECT: Build (400ms) → Stay Bright (10s) → Deflate (15s)
  const popNode = (node) => {
    if (!node || node.userData.isPopping) return; // Prevent double-pop

    // Mark as actively popping
    node.userData.isPopping = true;
    node.userData.isFlashing = true; // Disable breathing

    const originalScale = node.userData.baseScale || 0.7;
    const originalEmissiveIntensity = 0.3;

    // PHASE 1: BUILD UP (Pop activation) - 400ms
    let buildProgress = 0;
    const buildDuration = 400;
    const buildStart = Date.now();

    const buildUp = () => {
      const elapsed = Date.now() - buildStart;
      buildProgress = Math.min(elapsed / buildDuration, 1);

      if (buildProgress < 1) {
        // Ease out cubic - quick acceleration, slow deceleration
        const eased = 1 - Math.pow(1 - buildProgress, 3);

        // Scale up to 1.3x
        node.scale.setScalar(originalScale * (1 + eased * 0.3));

        // Emissive ramps up
        node.material.emissiveIntensity = originalEmissiveIntensity + (eased * 1.5);

        // Halo grows
        if (node.userData.halo) {
          node.userData.halo.material.opacity = 0.15 + (eased * 0.5);
          node.userData.halo.scale.setScalar(originalScale * (1.8 + eased * 1.0));
          node.userData.halo.material.needsUpdate = true;
        }

        node.material.needsUpdate = true;
        requestAnimationFrame(buildUp);
      } else {
        // PHASE 1 COMPLETE - Start Phase 2
        stayBright();
      }
    };

    // PHASE 2: STAY BRIGHT (Popped state) - 10 SECONDS
    const stayBright = () => {
      // Removed log

      // Lock at peak brightness
      const poppedScale = originalScale * 1.3;
      node.scale.setScalar(poppedScale);
      node.material.emissiveIntensity = 1.8; // BRIGHT!

      if (node.userData.halo) {
        node.userData.halo.material.opacity = 0.65;
        node.userData.halo.scale.setScalar(originalScale * 2.8);
        node.userData.halo.material.needsUpdate = true;
      }

      node.material.needsUpdate = true;

      // STAY in this state for 10 seconds (orchestral timing)
      setTimeout(() => {
        deflate();
      }, 10000); // CRITICAL: Stay bright for 10 seconds!
    };

    // PHASE 3: DEFLATE (Gentle fade back) - 15 SECONDS
    const deflate = () => {
      // Removed log

      let deflateProgress = 0;
      const deflateDuration = 15000; // 15 SECONDS (orchestral fade)
      const deflateStart = Date.now();
      const poppedScale = originalScale * 1.3;

      const deflateAnim = () => {
        const elapsed = Date.now() - deflateStart;
        deflateProgress = Math.min(elapsed / deflateDuration, 1);

        if (deflateProgress < 1) {
          // Ease in cubic - slow start, faster end
          const eased = deflateProgress * deflateProgress * deflateProgress;

          // Scale back down
          const currentScale = poppedScale - ((poppedScale - originalScale) * eased);
          node.scale.setScalar(currentScale);

          // Emissive fades
          const currentEmissive = 1.8 - ((1.8 - originalEmissiveIntensity) * eased);
          node.material.emissiveIntensity = currentEmissive;

          // Halo deflates
          if (node.userData.halo) {
            const currentHaloOpacity = 0.65 - (0.5 * eased);
            const currentHaloScale = (originalScale * 2.8) - (originalScale * 1.0 * eased);
            node.userData.halo.material.opacity = currentHaloOpacity;
            node.userData.halo.scale.setScalar(currentHaloScale);
            node.userData.halo.material.needsUpdate = true;
          }

          node.material.needsUpdate = true;
          requestAnimationFrame(deflateAnim);
        } else {
          // FULLY DEFLATED - Return to normal
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

          // Removed log
        }
      };

      requestAnimationFrame(deflateAnim);
    };

    // Start Phase 1
    requestAnimationFrame(buildUp);
  };

  // Expose activation method to parent
  useImperativeHandle(ref, () => ({
    // Method for streaming tokens - Popcorn effect with 7-second gradual deployment
    addToken: (_token) => {
      console.log('🎬 Gradual 7-second deployment starting');

      if (nodeObjectsRef.current.length === 0) return;

      // Activate 15% of nodes (cleaner, more cinematic)
      const numToActivate = Math.floor(nodeObjectsRef.current.length * 0.15);
      const activatedIndices = new Set();

      while (activatedIndices.size < numToActivate) {
        activatedIndices.add(Math.floor(Math.random() * nodeObjectsRef.current.length));
      }

      // Sort by distance from center (wave from inside out - like stars appearing)
      const activatedNodes = Array.from(activatedIndices).map(idx => ({
        index: idx,
        node: nodeObjectsRef.current[idx]
      }));

      activatedNodes.sort((a, b) => {
        return a.node.position.length() - b.node.position.length();
      });

      // FASTER: Spread deployment over 7 SECONDS
      // Perfect pace: 7s up → 10s hold → 15s down
      const totalDeploymentTime = 7000; // 7 SECONDS (was 15s)
      const staggerDelay = totalDeploymentTime / numToActivate;

      console.log(`✨ Will deploy ${numToActivate} nodes over ${totalDeploymentTime / 1000}s (${Math.round(staggerDelay)}ms between each)`);

      activatedNodes.forEach((item, arrayIndex) => {
        setTimeout(() => {
          popNode(item.node);
          console.log(`🍿 Node ${arrayIndex + 1}/${numToActivate} popped at ${Math.round(arrayIndex * staggerDelay)}ms`);
        }, arrayIndex * staggerDelay);
      });
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
