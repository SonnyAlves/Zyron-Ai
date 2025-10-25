import * as THREE from 'three';

export const nodeShader = {
  vertexShader: `
  attribute float size;
  attribute vec3 nodeColor;
  attribute float activation;
  uniform float uTime;
  uniform float uBreathing;
  varying vec3 vColor;
  varying float vActivation;
  varying float vSize;

  void main() {
    vColor = nodeColor;
    vActivation = activation;

    // Breathing animation: subtle size variation
    float breathing = 0.95 + 0.05 * uBreathing;

    // Activation glow: triggered when nodes are created
    float activationGlow = activation > 0.0 ? 1.5 : 1.0;

    vSize = size * breathing * activationGlow;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = vSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }`,

  fragmentShader: `
  uniform float uTime;
  varying vec3 vColor;
  varying float vActivation;
  varying float vSize;

  void main() {
    // Soft circular gradient for organic appearance
    vec2 center = gl_PointCoord - 0.5;
    float distance = length(center);

    // Main node: soft falloff
    float core = smoothstep(0.5, 0.0, distance);

    // Soft halo: extended glow around node
    float halo = exp(-distance * 3.5) * 0.5;

    // Combine core and halo
    float alpha = core + halo;

    // Enhanced opacity for pastel colors
    alpha *= 0.95;

    // Activation creates brighter glow
    if (vActivation > 0.0) {
      alpha += vActivation * 0.5 * exp(-distance * 2.0);
    }

    vec3 finalColor = vColor;

    // Subtle time-based pulsing for living feel
    finalColor *= (0.95 + 0.05 * sin(uTime * 2.0));

    // Activation makes color brighter
    if (vActivation > 0.0) {
      finalColor += vec3(0.1) * vActivation;
    }

    gl_FragColor = vec4(finalColor, alpha);
  }`
};

export const connectionShader = {
  vertexShader: `
  uniform float uTime;
  varying vec3 vColor;

  void main() {
    vColor = vec3(0.8);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }`,

  fragmentShader: `
  uniform float uTime;
  varying vec3 vColor;

  void main() {
    // Simple line rendering
    gl_FragColor = vec4(vColor, 0.6);
  }`
};

// Emergent aesthetic pastel color palette (7 categories)
export const colorPalettes = [
  // Organic pastel colors matching Emergent design
  [
    new THREE.Color(0x4ade80), // Green - GOAL
    new THREE.Color(0x60a5fa), // Blue - IDEA
    new THREE.Color(0xfbbf24), // Yellow - TASK
    new THREE.Color(0xfb7185), // Pink - EMOTION
    new THREE.Color(0xa78bfa), // Purple - REFLECTION
    new THREE.Color(0xf97316), // Orange - INSIGHT
    new THREE.Color(0xa16207)  // Brown - SYSTEM
  ]
];

export default {
  nodeShader,
  connectionShader,
  colorPalettes
};
