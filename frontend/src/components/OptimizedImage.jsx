/**
 * OptimizedImage Component
 * Serves WebP format with PNG fallback for better performance
 *
 * Usage:
 * <OptimizedImage src="/zyron-logo.png" alt="Logo" />
 */

import { useState, useEffect } from 'react'

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  ...props
}) {
  const [supportsWebP, setSupportsWebP] = useState(true)

  useEffect(() => {
    // Check WebP support
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    setSupportsWebP(canvas.toDataURL('image/webp') !== 'data:image/webp;')
  }, [])

  // Convert .png/.jpg to .webp if supported
  const webpSrc = supportsWebP ? src.replace(/\.(png|jpg|jpeg)$/i, '.webp') : src

  return (
    <picture>
      {supportsWebP && <source srcSet={webpSrc} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        {...props}
      />
    </picture>
  )
}
