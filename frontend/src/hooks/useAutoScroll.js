import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for intelligent auto-scrolling using IntersectionObserver
 * Only scrolls to bottom if user is already viewing the bottom of the conversation
 * Prevents jarring scroll jumps when user is reading messages higher up
 *
 * @param {React.RefObject} messagesEndRef - Ref to the scroll anchor element
 * @param {React.RefObject} messagesContainerRef - Ref to the scrollable container
 * @param {Array} dependencies - Dependencies array (messages, isThinking, etc.)
 * @returns {void}
 */
export function useAutoScroll(messagesEndRef, messagesContainerRef, dependencies = []) {
  const observerRef = useRef(null)
  const shouldAutoScrollRef = useRef(true)

  // Smooth scroll to bottom when anchor is visible
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [messagesEndRef])

  // Setup IntersectionObserver to track when scroll anchor is visible
  useEffect(() => {
    const options = {
      root: messagesContainerRef.current,
      threshold: 0,
    }

    // Create observer to watch the scroll anchor
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // If anchor is visible, user can see the bottom
        shouldAutoScrollRef.current = entry.isIntersecting
      })
    }, options)

    // Start observing the anchor
    if (messagesEndRef.current) {
      observerRef.current.observe(messagesEndRef.current)
    }

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current && messagesEndRef.current) {
        observerRef.current.unobserve(messagesEndRef.current)
      }
    }
  }, [messagesContainerRef, messagesEndRef])

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom()
    }
  }, dependencies)
}

/**
 * Alternative hook for manual scroll control without IntersectionObserver
 * Use this if you need more explicit control over when scrolling occurs
 *
 * @param {React.RefObject} messagesEndRef - Ref to the scroll anchor element
 * @param {boolean} shouldScroll - Whether to trigger scroll
 * @returns {void}
 */
export function useSimpleAutoScroll(messagesEndRef, shouldScroll = true) {
  useEffect(() => {
    if (shouldScroll && messagesEndRef.current) {
      // Small delay to allow DOM updates
      const timeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 50)

      return () => clearTimeout(timeout)
    }
  }, [shouldScroll, messagesEndRef])
}
