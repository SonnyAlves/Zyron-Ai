import { useState, useEffect, useRef } from 'react'
import VisualBrain from './VisualBrain'
import ChatPanelContent from './ChatPanelContent'
import ZyronLogo from './ZyronLogo'
import './MainLayout.css'

export default function MainLayout() {
  const [isThinking, setIsThinking] = useState(false)
  const [tokens, setTokens] = useState([])
  const [response, setResponse] = useState('')
  const [message, setMessage] = useState('')
  const [viewMode, setViewMode] = useState('split')  // 'split', 'graph', 'chat'
  const visualBrainRef = useRef(null)

  const handleSendMessage = async (messageText) => {
    setMessage(messageText)
    try {
      setIsThinking(true)
      setResponse('')
      setTokens([])

      const res = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
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
        buffer = lines[lines.length - 1]

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i]
          if (line.startsWith('data: ')) {
            const text = line.slice(6)
            if (text) {
              setResponse((prev) => prev + text)
              setTokens((prev) => [...prev, text])
            }
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        const text = buffer.slice(6)
        if (text) {
          setResponse((prev) => prev + text)
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

  const handleClearChat = () => {
    setMessage('')
    setResponse('')
    setTokens([])
  }

  // Trigger node activation when tokens arrive
  useEffect(() => {
    if (tokens.length > 0 && visualBrainRef.current) {
      // Random node activation from brain nodes
      const nodeIds = [
        'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8',
        'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12', 'i13', 'i14',
        't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9',
        'e1', 'e2', 'e3', 'e4', 'e5',
        'r1', 'r2', 'r3', 'r4', 'r5',
        'in1', 'in2', 'in3',
        's1', 's2', 's3'
      ]

      // Get a random subset of nodes to activate based on token count
      const activationCount = Math.min(Math.floor(tokens.length / 10) + 1, 5)
      const activatedNodes = []
      for (let i = 0; i < activationCount; i++) {
        const randomIdx = Math.floor(Math.random() * nodeIds.length)
        activatedNodes.push({
          nodeId: nodeIds[randomIdx],
          energyDelta: 0.1 + Math.random() * 0.1
        })
      }

      visualBrainRef.current.applyActivations(activatedNodes)
    }
  }, [tokens])

  // Keyboard shortcuts: G (graph), C (chat), S (split)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger shortcuts if user is typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      const key = e.key.toLowerCase()
      if (key === 'g') {
        setViewMode('graph')
      } else if (key === 'c') {
        setViewMode('chat')
      } else if (key === 's') {
        setViewMode('split')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="main-layout" data-view-mode={viewMode}>
      {/* Header with Zyron Logo and View Mode Controls */}
      <header className="main-header">
        <ZyronLogo size="md" href="/" />

        {/* View Mode Controls */}
        <div className="view-mode-controls">
          <button
            className={`view-mode-btn ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
            title="Full Graph (G)"
            aria-label="Full Graph View"
          >
            Graph
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split View (S)"
            aria-label="Split View"
          >
            ← Split
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'chat' ? 'active' : ''}`}
            onClick={() => setViewMode('chat')}
            title="Full Chat (C)"
            aria-label="Full Chat View"
          >
            Chat
          </button>
        </div>
      </header>

      {/* Content container - Chat LEFT, Graph RIGHT */}
      <div className="content-wrapper">
        {/* Chat Panel - LEFT side (30%) - Shows in Chat and Split modes */}
        {viewMode !== 'graph' && (
          <div className="chat-section">
            <ChatPanelContent
              message={message}
              response={response}
              isThinking={isThinking}
              onSendMessage={handleSendMessage}
              onClearChat={handleClearChat}
            />
          </div>
        )}

        {/* Visual Brain - RIGHT side (70%) - Shows in Graph and Split modes */}
        {viewMode !== 'chat' && (
          <div className="visual-brain-section">
            <VisualBrain
              ref={visualBrainRef}
              isThinking={isThinking}
              tokens={tokens}
              onNodeClick={(node) => console.log('Node clicked:', node)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
