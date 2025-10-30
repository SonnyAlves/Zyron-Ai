import { useState, useRef, useEffect } from 'react'
import VisualBrain from './VisualBrain/VisualBrain'
import { apiService } from '../services/apiService'

export default function ChatInterface() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [tokens, setTokens] = useState([])
  const [error, setError] = useState(null)
  const tokenCounterRef = useRef(0)
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
      setTokens([])
      setError(null)
      tokenCounterRef.current = 0

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
            const text = line.slice(6)
            if (text) {
              setResponse((prev) => prev + text)
              tokenCounterRef.current++
              setTokens((prev) => [...prev, text])
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        const text = buffer.slice(6)
        if (text) {
          setResponse((prev) => prev + text)
          tokenCounterRef.current++
          setTokens((prev) => [...prev, text])
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

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui',
      }}
    >
      <h1>Zyron AI</h1>

      <VisualBrain
        isThinking={isThinking}
        tokens={tokens}
        tokenCount={tokenCounterRef.current}
        onNodeClick={(node) => console.log('Node clicked:', node)}
      />

      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleTextareaChange}
        onKeyPress={handleKeyPress}
        placeholder="Ask Zyron anything... (Ctrl+Enter to send)"
        disabled={isThinking}
        style={{
          width: '100%',
          minHeight: '44px',
          maxHeight: '200px',
          height: '44px',
          padding: '10px',
          fontSize: '16px',
          marginBottom: '10px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontFamily: 'system-ui',
          resize: 'none',
          overflow: 'auto',
        }}
      />

      <button
        onClick={sendMessage}
        disabled={isThinking || !message.trim()}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor:
            isThinking || !message.trim() ? 'not-allowed' : 'pointer',
          backgroundColor:
            isThinking || !message.trim() ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          opacity:
            isThinking || !message.trim() ? 0.5 : 1,
        }}
      >
        {isThinking ? 'Envoi...' : 'Send'}
      </button>

      {/* Error Display */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: '#FFF3CD',
          border: '1px solid #FFC107',
          borderRadius: '6px',
          color: '#856404',
          fontSize: '14px',
          marginTop: '10px',
        }}>
          <div style={{ fontSize: '18px', lineHeight: '1' }}>⚠️</div>
          <div style={{ flex: 1, lineHeight: '1.4' }}>
            <strong>Erreur:</strong> {error}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '20px',
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '8px',
          minHeight: '200px',
          maxHeight: '500px',
          overflowY: 'auto',
        }}
      >
        <strong>
          Zyron:
          {isThinking && (
            <span style={{
              marginLeft: '10px',
              fontSize: '14px',
              color: '#007bff',
              fontWeight: 'normal',
            }}>
              <span style={{
                display: 'inline-block',
                animation: 'spin 2s linear infinite',
              }}>⚙️</span> réfléchit...
            </span>
          )}
        </strong>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px', lineHeight: '1.6' }}>
          {response || '(waiting for response...)'}
        </p>
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}
