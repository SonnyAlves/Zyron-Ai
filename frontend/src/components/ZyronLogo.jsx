import React from 'react';
import './ZyronLogo.css';

/**
 * Zyron Logo Component - Icon only with text label
 * Features:
 * - Clean geometric icon design with vibrant colors
 * - Responsive sizing (size prop: 'sm' | 'md' | 'lg')
 * - Clickable link to home
 * - Fully accessible
 * - Optimized for dark backgrounds
 */
export default function ZyronLogo({ size = 'md', href = '/', className = '', showText = true }) {
  const sizeClass = `zyron-logo--${size}`;
  const classes = `zyron-logo ${sizeClass} ${className}`.trim();

  return (
    <a href={href} className={classes} aria-label="Zyron AI - Home">
      <img
        src="/zyron-logo-official.png"
        alt="Zyron AI Logo"
        className="zyron-logo__svg"
      />
      {showText && <span className="zyron-logo__text">Zyron AI</span>}
    </a>
  );
}
