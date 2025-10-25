import { useEffect, useRef, useState } from 'react';
import { NeuralNetwork } from './NeuralNetwork';
import Controls from './Controls';
import './styles.css';

export default function VisualBrain({ isThinking, tokens, onNodeClick }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [theme, setTheme] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [density, setDensity] = useState(100);
  const [mode, setMode] = useState('dark');  // NEW: dark or light
  const prevTokensLengthRef = useRef(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    networkRef.current = new NeuralNetwork(containerRef.current);
    networkRef.current.init();

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, []);

  // React to streaming tokens: add nodes and trigger pulses
  useEffect(() => {
    if (!isThinking || !tokens || tokens.length === 0 || !networkRef.current) return;

    const currentLength = tokens.length;
    const prevLength = prevTokensLengthRef.current;

    // New tokens received
    if (currentLength > prevLength) {
      const newTokensCount = currentLength - prevLength;
      for (let i = 0; i < newTokensCount; i++) {
        networkRef.current.addNode(tokens[prevLength + i]);
        networkRef.current.triggerPulse();
      }
    }

    prevTokensLengthRef.current = currentLength;
  }, [isThinking, tokens]);

  // Update thinking state and reset tokens counter
  useEffect(() => {
    if (networkRef.current) {
      networkRef.current.setThinkingState(isThinking);
    }
    if (!isThinking) {
      prevTokensLengthRef.current = 0;
    }
  }, [isThinking]);

  // Handle theme change
  useEffect(() => {
    if (networkRef.current) {
      networkRef.current.updateTheme(theme);
    }
  }, [theme]);

  // Handle pause toggle
  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
    if (networkRef.current) {
      networkRef.current.togglePause();
    }
  };

  // Handle formation change
  const handleFormationChange = () => {
    if (networkRef.current) {
      networkRef.current.changeFormation();
    }
  };

  // Handle camera reset
  const handleResetCamera = () => {
    if (networkRef.current) {
      networkRef.current.resetCamera();
    }
  };

  // Handle density change
  const handleDensityChange = (value) => {
    setDensity(value);
    if (networkRef.current) {
      networkRef.current.setDensity(value);
    }
  };

  // Handle mode change
  const handleModeChange = (newMode) => {
    console.log('🎨 [VisualBrain] Mode change requested:', newMode);
    setMode(newMode);
  };

  // Update mode when it changes
  useEffect(() => {
    console.log('🔄 [VisualBrain] Mode state changed to:', mode);
    if (networkRef.current && networkRef.current.updateMode) {
      console.log('📡 [VisualBrain] Calling updateMode() on NeuralNetwork');
      networkRef.current.updateMode(mode);
    } else {
      console.error('❌ [VisualBrain] updateMode() not found on networkRef.current');
    }
  }, [mode]);

  return (
    <div className="visual-brain-container">
      <div ref={containerRef} className="canvas-container" />
      <Controls
        theme={theme}
        onThemeChange={setTheme}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
        onFormationChange={handleFormationChange}
        onResetCamera={handleResetCamera}
        density={density}
        onDensityChange={handleDensityChange}
        mode={mode}
        onModeToggle={handleModeChange}
      />
    </div>
  );
}
