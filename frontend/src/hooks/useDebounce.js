import { useEffect, useRef } from 'react'

/**
 * useDebounce Hook
 * Delays function execution until X milliseconds after the last call
 * Useful for: search, auto-save, input validation, etc.
 *
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @param {Array} dependencies - Dependencies array for useEffect
 * @returns {Function} Debounced function
 *
 * @example
 * const debouncedSearch = useDebounce((query) => {
 *   searchAPI(query)
 * }, 500, [])
 */
export function useDebounce(callback, delay = 300, dependencies = []) {
  const timeoutRef = useRef(null)

  const debouncedFunction = (...args) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }

  // Cleanup on unmount or dependency change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)

  return debouncedFunction
}

/**
 * useThrottle Hook
 * Limits function execution to once per X milliseconds
 * Useful for: scroll events, resize, mouse move, etc.
 *
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Limit in milliseconds (default: 300ms)
 * @param {Array} dependencies - Dependencies array for useEffect
 * @returns {Function} Throttled function
 */
export function useThrottle(callback, limit = 300, dependencies = []) {
  const lastRunRef = useRef(Date.now())
  const timeoutRef = useRef(null)

  const throttledFunction = (...args) => {
    const now = Date.now()
    const timeSinceLastRun = now - lastRunRef.current

    if (timeSinceLastRun >= limit) {
      // Execute immediately
      callback(...args)
      lastRunRef.current = now
    } else {
      // Schedule for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
        lastRunRef.current = Date.now()
      }, limit - timeSinceLastRun)
    }
  }

  // Cleanup on unmount or dependency change
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, dependencies)

  return throttledFunction
}
