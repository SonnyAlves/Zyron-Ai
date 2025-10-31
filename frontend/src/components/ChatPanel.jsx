import { useState, useRef, useEffect, memo, useCallback } from 'react'
import './ChatPanel.css'
import { apiService } from '../services/apiService'

function ChatPanel() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to bottom when response changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (response || isThinking) {
      scrollToBottom()
    }
  }, [response, isThinking])

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    const textarea = e.target
    setMessage(textarea.value)

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Set new height based on content (min 44px, max 200px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 200)
    textarea.style.height = `${newHeight}px`
  }

  const sendMessage = async () => {
    if (!message.trim() || isThinking) return

    try {
      setIsThinking(true)
      setResponse('')
      setError(null)

      const payload = {
        message: message,
      }

      const res = await apiService.sendChatMessageStream(payload)

      if (!res.ok) {
        throw new Error(`Le backend ne répond pas (HTTP ${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep last incomplete line in buffer
        buffer = lines[lines.length - 1]

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i]
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6)
            try {
              const parsed = JSON.parse(jsonStr)
              
              // Check if it's a structured response with text, clarification, graph_update
              let text = ''
              
              if (typeof parsed === 'object' && parsed !== null) {
                // Structured response from backend (extract text only)
                text = parsed.text || ''
              } else {
                // Simple string response
                text = parsed
              }
              
              if (text) {
                setResponse((prev) => prev + text)
              }
            } catch (e) {
              // Fallback for non-JSON data (old format)
              const text = jsonStr
              if (text) {
                setResponse((prev) => prev + text)
              }
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        const jsonStr = buffer.slice(6)
        try {
          const parsed = JSON.parse(jsonStr)
          
          // Check if it's a structured response with text, clarification, graph_update
          let text = ''
          
          if (typeof parsed === 'object' && parsed !== null) {
            // Structured response from backend (extract text only)
            text = parsed.text || ''
          } else {
            // Simple string response
            text = parsed
          }
          
          if (text) {
            setResponse((prev) => prev + text)
          }
        } catch (e) {
          // Fallback for non-JSON data (old format)
          const text = jsonStr
          if (text) {
            setResponse((prev) => prev + text)
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setError(error.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsThinking(false)
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px'
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      sendMessage()
    }
  }

  const clearChat = useCallback(() => {
    setMessage('')
    setResponse('')
    setError(null)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }, [])

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <h2 className="chat-panel__title">Zyron AI Chat</h2>
        <button
          onClick={clearChat}
          className="chat-panel__clear-button"
          title="Clear conversation"
        >
          ✕ Clear
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleTextareaChange}
        onKeyPress={handleKeyPress}
        placeholder="Ask Zyron anything... (Ctrl+Enter to send)"
        disabled={isThinking}
        className="chat-panel__textarea"
      />

      <button
        onClick={sendMessage}
        disabled={isThinking || !message.trim()}
        className="chat-panel__send-button"
      >
        {isThinking ? 'Envoi...' : '↗️ Send'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="chat-panel__error">
          <div className="chat-panel__error-icon">⚠️</div>
          <div className="chat-panel__error-message">
            <strong>Erreur:</strong> {error}
          </div>
        </div>
      )}

      <div className="chat-panel__response-container">
        <div className="chat-panel__response-label">
          <span>🧠 Zyron's Response</span>
          {isThinking && (
            <span className="chat-panel__thinking-indicator">
              <span className="chat-panel__spinner">⚙️</span> Zyron réfléchit...
            </span>
          )}
        </div>
        <div className="chat-panel__response-box">
          {response ? (
            <p className="chat-panel__response-text">{response}</p>
          ) : (
            <p className="chat-panel__placeholder-text">Ask a question to get started...</p>
          )}
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}

export default memo(ChatPanel)
