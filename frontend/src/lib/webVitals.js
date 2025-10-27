/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals (LCP, FID, CLS) and sends to Vercel Analytics
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Page loading performance
 * - FID (First Input Delay): User interaction responsiveness
 * - CLS (Cumulative Layout Shift): Visual stability
 * - TTFB (Time to First Byte): Server response time
 */

import {
  onCLS,
  onFID,
  onFCP,
  onLCP,
  onTTFB,
} from 'web-vitals'

/**
 * Send metric to Vercel Analytics endpoint
 * Works automatically with Vercel's built-in analytics
 */
const sendToAnalytics = (metric) => {
  // Send to Vercel Analytics (automatic in production)
  if (window.location.hostname !== 'localhost') {
    // Build endpoint URL
    const body = JSON.stringify(metric)

    // Use sendBeacon for reliability (doesn't block page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/_vercel/insights/event', body)
    } else {
      // Fallback for older browsers
      fetch('/_vercel/insights/event', {
        method: 'POST',
        body,
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't impact user experience
      })
    }
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', {
      name: metric.name,
      value: metric.value.toFixed(2),
      rating: metric.rating,
    })
  }
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your app (e.g., in main.jsx)
 */
export const initWebVitals = () => {
  // LCP: Largest Contentful Paint (when main content loads)
  // Good: < 2.5s, Needs Improvement: 2.5-4s, Poor: > 4s
  onLCP(sendToAnalytics)

  // FID: First Input Delay (how responsive to user input)
  // Good: < 100ms, Needs Improvement: 100-300ms, Poor: > 300ms
  onFID(sendToAnalytics)

  // CLS: Cumulative Layout Shift (visual stability)
  // Good: < 0.1, Needs Improvement: 0.1-0.25, Poor: > 0.25
  onCLS(sendToAnalytics)

  // FCP: First Contentful Paint (when content first appears)
  onFCP(sendToAnalytics)

  // TTFB: Time to First Byte (server response time)
  onTTFB(sendToAnalytics)
}

/**
 * Get current metrics summary
 * Useful for debugging performance issues
 */
export const getMetricsSnapshot = async () => {
  const metrics = {}

  // Create temporary listeners
  onLCP((m) => { metrics.lcp = m.value })
  onFID((m) => { metrics.fid = m.value })
  onCLS((m) => { metrics.cls = m.value })
  onFCP((m) => { metrics.fcp = m.value })
  onTTFB((m) => { metrics.ttfb = m.value })

  // Give metrics time to collect
  await new Promise(resolve => setTimeout(resolve, 100))

  return metrics
}
