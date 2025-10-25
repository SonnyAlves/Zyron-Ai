import React from 'react';
import './Logo.css';

/**
 * Logo Component - Displays Oryze branding
 * Features:
 * - SVG icon with custom Gyokz font
 * - Responsive sizing (size prop: 'sm' | 'md' | 'lg')
 * - Clickable link to home
 * - Accessible with aria-label
 */
export default function Logo({ size = 'md', href = '/', showText = true, className = '' }) {
  const sizeClass = `logo--${size}`;
  const classes = `logo ${sizeClass} ${className}`.trim();

  return (
    <a href={href} className={classes} aria-label="Aller à l'accueil">
      {/* SVG Logo Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="512"
        height="512"
        viewBox="0 0 512 512"
        className="logo__icon"
      >
        {/* Background hexagon */}
        <rect width="512" height="512" fill="#0C2A4A" rx="64" ry="64" />

        {/* Geometric pattern */}
        <g transform="translate(256,256)">
          {/* Outer hexagon - Cyan */}
          <polygon
            points="0,-180 155,-90 155,90 0,180 -155,90 -155,-90"
            fill="none"
            stroke="#00D1C1"
            strokeWidth="20"
          />

          {/* Inner lines - Purple */}
          <polyline
            points="-100,-50 100,-50 -100,50 100,50"
            fill="none"
            stroke="#6A3FF5"
            strokeWidth="26"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Logo Text with custom font */}
      {showText && <span className="logo__text">Zyron</span>}
    </a>
  );
}
