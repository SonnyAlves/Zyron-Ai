import { useState, useRef } from 'react'

export default function ChatPanel() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [tokens, setTokens] = useState([])
  const tokenCounterRef = useRef(0)

  const sendMessage = async () => {
    if (!message.trim()) return

    try {
      setIsThinking(true)
      setResponse('')
      setTokens([])
      tokenCounterRef.current = 0

      const res = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
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
      setResponse(`Error: ${error.message}`)
    } finally {
      setIsThinking(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessage('')
    setResponse('')
    setTokens([])
    tokenCounterRef.current = 0
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Zyron AI Chat</h2>
        <button
          onClick={clearChat}
          style={styles.clearButton}
          title="Clear conversation"
        >
          ✕ Clear
        </button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask Zyron anything... (Ctrl+Enter to send)"
        style={styles.textarea}
      />

      <button
        onClick={sendMessage}
        disabled={isThinking || !message.trim()}
        style={{
          ...styles.sendButton,
          opacity: isThinking || !message.trim() ? 0.6 : 1,
          backgroundColor: isThinking || !message.trim() ? '#666' : '#8B5CF6',
          cursor: isThinking || !message.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isThinking ? '⚙️ Thinking...' : '↗️ Send'}
      </button>

      <div style={styles.responseContainer}>
        <div style={styles.responseLabel}>
          <span>🧠 Zyron's Response</span>
          {isThinking && <span style={styles.thinkingIndicator}>● streaming...</span>}
        </div>
        <div style={styles.responseBox}>
          {response ? (
            <p style={styles.responseText}>{response}</p>
          ) : (
            <p style={styles.placeholderText}>Ask a question to get started...</p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '20px',
    gap: '15px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#0a0e27',
    color: '#e0e0e0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
    paddingBottom: '15px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  clearButton: {
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: '#e0e0e0',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  textarea: {
    flex: '0 0 100px',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    backgroundColor: '#1a1f3a',
    color: '#e0e0e0',
    fontFamily: 'system-ui, monospace',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  responseContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: 0,
  },
  responseLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  thinkingIndicator: {
    fontSize: '11px',
    color: '#3B82F6',
    animation: 'pulse 1.5s infinite',
  },
  responseBox: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#1a1f3a',
    borderRadius: '8px',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    overflowY: 'auto',
    minHeight: 0,
  },
  responseText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    lineHeight: '1.6',
    color: '#e0e0e0',
  },
  placeholderText: {
    margin: 0,
    color: '#666',
    fontStyle: 'italic',
  },
}
