import { useCallback, useRef, useState } from 'react'

/**
 * Custom hook for handling streaming chat API calls with error recovery
 * Provides:
 * - AbortController for "Stop generating" functionality
 * - Retry logic with exponential backoff
 * - Streaming response parsing (Server-Sent Events format)
 * - Error recovery and fallback
 * - Loading state management
 *
 * @param {string} apiUrl - Base API URL (e.g., 'http://localhost:8001')
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @returns {Object} Hook API
 */
export function useStreamingChat(apiUrl = 'http://localhost:8001', maxRetries = 2) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAborted, setIsAborted] = useState(false)
  const abortControllerRef = useRef(null)
  const retriesRef = useRef(0)

  /**
   * Send message and stream response
   * Calls onChunk callback for each received token
   *
   * @param {string} message - User message to send
   * @param {Function} onChunk - Callback called for each streamed token
   * @param {Function} onComplete - Callback when streaming completes
   * @param {Function} onError - Callback for errors
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(
    async (message, onChunk, onComplete, onError) => {
      if (!message.trim()) {
        setError('Message cannot be empty')
        return
      }

      // Reset state
      setIsLoading(true)
      setError(null)
      setIsAborted(false)
      retriesRef.current = 0

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()

      const attemptRequest = async (retryCount = 0) => {
        try {
          const response = await fetch(`${apiUrl}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          // Stream response
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let fullContent = ''

          try {
            while (true) {
              const { done, value } = await reader.read()

              // Check if request was aborted
              if (isAborted) {
                reader.cancel()
                break
              }

              if (done) break

              // Decode and parse chunks
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines[lines.length - 1]

              // Process complete lines
              for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i]
                if (line.startsWith('data: ')) {
                  // Parse JSON to get the properly decoded text
                  const jsonStr = line.slice(6)
                  try {
                    const text = JSON.parse(jsonStr)
                    // DEBUG: Log SSE parsing details
                    if (text && i < 3) { // Only log first 3 chunks to avoid spam
                      console.log(`🔍 SSE Chunk ${i}:`, {
                        rawJsonStr: jsonStr.substring(0, 100),
                        parsedText: text.substring(0, 100),
                        hasLiteralBackslashN: text.includes('\\n'),
                        hasRealNewline: text.includes('\n'),
                        hasLiteralBackslashU: text.includes('\\u'),
                      })
                    }
                    if (text) {
                      fullContent += text
                      onChunk?.(text)
                    }
                  } catch (e) {
                    // Fallback for non-JSON data
                    console.warn('⚠️  JSON.parse failed, using raw text:', e.message)
                    console.log('📦 Raw jsonStr:', jsonStr.substring(0, 100))
                    const text = jsonStr
                    if (text) {
                      fullContent += text
                      onChunk?.(text)
                    }
                  }
                }
              }
            }

            // Process remaining buffer
            if (buffer.startsWith('data: ')) {
              // Parse JSON to get the properly decoded text
              const jsonStr = buffer.slice(6)
              try {
                const text = JSON.parse(jsonStr)
                if (text) {
                  fullContent += text
                  onChunk?.(text)
                }
              } catch (e) {
                // Fallback for non-JSON data
                const text = jsonStr
                if (text) {
                  fullContent += text
                  onChunk?.(text)
                }
              }
            }

            // Success
            setIsLoading(false)
            onComplete?.(fullContent)
          } catch (streamError) {
            if (streamError.name === 'AbortError') {
              setIsAborted(true)
              setIsLoading(false)
              setError('Generation stopped by user')
            } else {
              throw streamError
            }
          }
        } catch (err) {
          // Handle errors with retry logic
          if (
            err.name === 'AbortError' ||
            (err.message && err.message.includes('aborted'))
          ) {
            setIsAborted(true)
            setIsLoading(false)
            return
          }

          if (retryCount < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = Math.pow(2, retryCount) * 1000
            console.warn(
              `Streaming failed: ${err.message}. Retrying in ${delayMs}ms... (${retryCount + 1}/${maxRetries})`
            )

            await new Promise((resolve) => setTimeout(resolve, delayMs))
            return attemptRequest(retryCount + 1)
          } else {
            // All retries failed
            setIsLoading(false)
            setError(err.message || 'Failed to get response. Please try again.')
            onError?.(err)
          }
        }
      }

      await attemptRequest()
    },
    [apiUrl, maxRetries]
  )

  /**
   * Abort the current streaming request
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      setIsAborted(true)
      abortControllerRef.current.abort()
      setIsLoading(false)
    }
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    isLoading,
    error,
    isAborted,

    // Methods
    sendMessage,
    abort,
    clearError,
  }
}

/**
 * Simpler streaming hook for basic use cases
 * Without retry logic or advanced error handling
 */
export function useSimpleStreaming(apiUrl = 'http://localhost:8001') {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  const stream = useCallback(
    async (message, onChunk, onComplete) => {
      setIsLoading(true)
      setError(null)
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let content = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines[lines.length - 1]

          for (let i = 0; i < lines.length - 1; i++) {
            if (lines[i].startsWith('data: ')) {
              // Parse JSON to get the properly decoded text
              const jsonStr = lines[i].slice(6)
              try {
                const text = JSON.parse(jsonStr)
                if (text) {
                  content += text
                  onChunk?.(text)
                }
              } catch (e) {
                // Fallback for non-JSON data
                const text = jsonStr
                if (text) {
                  content += text
                  onChunk?.(text)
                }
              }
            }
          }
        }

        if (buffer.startsWith('data: ')) {
          // Parse JSON to get the properly decoded text
          const jsonStr = buffer.slice(6)
          try {
            const text = JSON.parse(jsonStr)
            if (text) {
              content += text
              onChunk?.(text)
            }
          } catch (e) {
            // Fallback for non-JSON data
            const text = jsonStr
            if (text) {
              content += text
              onChunk?.(text)
            }
          }
        }

        setIsLoading(false)
        onComplete?.(content)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
        setIsLoading(false)
      }
    },
    [apiUrl]
  )

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  return { isLoading, error, stream, abort }
}
