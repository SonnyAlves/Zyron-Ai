import { useState, useRef } from 'react'
import VisualBrain from './VisualBrain/VisualBrain'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function ChatInterface() {
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

      const res = await fetch(`${API_URL}/chat`, {
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
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask Zyron anything... (Ctrl+Enter to send)"
        style={{
          width: '100%',
          height: '100px',
          padding: '10px',
          fontSize: '16px',
          marginBottom: '10px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontFamily: 'system-ui',
          resize: 'vertical',
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
            isThinking || !message.trim() ? 0.6 : 1,
        }}
      >
        {isThinking ? 'Thinking...' : 'Send'}
      </button>

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
        <strong>Zyron:</strong>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: '10px', lineHeight: '1.6' }}>
          {response || '(waiting for response...)'}
        </p>
      </div>
    </div>
  )
}
