import React from 'react';

export default function Controls({
  theme,
  onThemeChange,
  isPaused,
  onPauseToggle,
  onFormationChange,
  onResetCamera,
  density,
  onDensityChange,
  mode,
  onModeToggle
}) {
  return (
    <>
      {/* Palantir-style Mode Toggle */}
      <div className="ui-panel mode-toggle-container">
        <div
          className={`mode-toggle ${mode === 'light' ? 'light' : 'dark'}`}
          onClick={() => {
            const newMode = mode === 'dark' ? 'light' : 'dark';
            console.log(`🔄 [Controls] Toggle clicked - switching to ${newMode}`);
            onModeToggle(newMode);
          }}
          title="Toggle Dark/Light mode"
        >
          <div className="toggle-slider">
            <span className="toggle-icon">
              {mode === 'dark' ? '🌙' : '☀️'}
            </span>
          </div>
          <div className="toggle-track"></div>
        </div>
      </div>

      {/* Theme Selector */}
      <div className="theme-selector">
        <div className="theme-selector-title">Visual Theme</div>
        <div className="theme-grid">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              className={`theme-button theme-${index + 1} ${theme === index ? 'active' : ''}`}
              onClick={() => onThemeChange(index)}
              aria-label={`Theme ${index + 1}`}
            />
          ))}
        </div>
        <div className="density-controls">
          <div className="density-label">
            <span>Density</span>
            <span>{Math.round(density)}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={density}
            className="density-slider"
            onChange={(e) => onDensityChange(Number(e.target.value))}
            aria-label="Network Density"
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="visual-brain-controls">
        <button
          className="control-button"
          onClick={onFormationChange}
          title="Change neural network formation"
        >
          Formation
        </button>
        <button
          className={`control-button ${isPaused ? 'active' : ''}`}
          onClick={onPauseToggle}
          title={isPaused ? 'Resume animation' : 'Pause animation'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="control-button"
          onClick={onResetCamera}
          title="Reset camera position"
        >
          Reset Cam
        </button>
      </div>
    </>
  );
}
