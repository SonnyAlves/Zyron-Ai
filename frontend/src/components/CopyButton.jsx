import React, { useState, useCallback, memo } from 'react'
import './CopyButton.css'

/**
 * CopyButton Component
 * Reusable copy-to-clipboard button with feedback
 *
 * @param {string} text - Text to copy when clicked
 * @param {string} label - Button label (default: "Copy")
 * @param {function} onCopy - Callback after successful copy
 * @param {number} feedbackDuration - How long to show "Copied!" (default: 2000ms)
 * @param {string} className - Additional CSS classes
 * @param {string} variant - Button variant: "default" | "subtle" | "compact"
 *
 * @example
 * <CopyButton text="npm install package" label="Copy Command" variant="compact" />
 */
const CopyButton = memo(({
  text,
  label = 'Copy',
  onCopy,
  feedbackDuration = 2000,
  className = '',
  variant = 'default'
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)

      // Show "Copied!" feedback
      setTimeout(() => {
        setCopied(false)
      }, feedbackDuration)

      // Call optional callback
      onCopy?.()
    } catch (err) {
      console.error('Failed to copy:', err)
      // Could add toast notification here
    }
  }, [text, feedbackDuration, onCopy])

  const buttonClasses = `copy-button copy-button--${variant} ${copied ? 'copy-button--copied' : ''} ${className}`

  return (
    <button
      className={buttonClasses}
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : label}
      title={copied ? 'Copied!' : label}
      type="button"
    >
      {copied ? (
        <>
          <svg
            className="copy-icon copy-icon--check"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="copy-text">Copied!</span>
        </>
      ) : (
        <>
          <svg
            className="copy-icon copy-icon--clipboard"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="copy-text">{label}</span>
        </>
      )}
    </button>
  )
}, (prevProps, nextProps) => {
  // Memoization: only re-render if text or variant changes
  return prevProps.text === nextProps.text && prevProps.variant === nextProps.variant
})

CopyButton.displayName = 'CopyButton'

export default CopyButton
