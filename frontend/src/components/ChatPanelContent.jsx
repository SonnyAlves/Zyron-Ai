import { useState } from 'react'
import { useStore } from '../store/useStore'
import MessageContent from './MessageContent'

export default function ChatPanelContent({ onSendMessage, isThinking }) {
  const [localMessage, setLocalMessage] = useState('')
  const messages = useStore(state => state.messages)
  const currentConversationId = useStore(state => state.currentConversationId)

  console.log('🔥 ChatPanelContent rendering', {
    messageCount: messages.length,
    currentConversationId,
    isThinking
  })

  const handleSend = () => {
    if (!localMessage.trim() || isThinking) return
    onSendMessage(localMessage)
    setLocalMessage('')
  }

  const handleSuggestionClick = (suggestion) => {
    console.log('🔵 Suggestion clicked:', suggestion)
    console.log('🔵 isThinking:', isThinking)
    console.log('🔵 onSendMessage exists?', !!onSendMessage)

    if (isThinking) {
      console.log('⚠️ Cannot send - AI is thinking')
      return
    }

    if (!onSendMessage) {
      console.error('❌ onSendMessage prop is undefined!')
      return
    }

    console.log('✅ Calling onSendMessage with:', suggestion)
    onSendMessage(suggestion)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="chat-area-nuclear"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* MAIN CONTENT CONTAINER - FORCE VISIBLE */}
      <div
        className="messages-container-nuclear"
        style={{
          flex: 1,
          width: '100%',
          minHeight: '600px',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          overflow: 'auto',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Welcome Content - only show when no messages AND not thinking */}
        {messages.length === 0 && !isThinking && (
          <div style={{
            textAlign: 'center',
            maxWidth: '600px',
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{
              fontSize: '32px',
              marginBottom: '16px',
              color: '#1F2937',
              fontWeight: '400',
              fontFamily: "'Gyokz Regular', 'Gyokz', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}>
              Bienvenue sur Zyron AI
            </h1>
            <p style={{
              color: '#6B7280',
              marginBottom: '32px',
              fontSize: '16px',
              fontFamily: "'Gyokz Regular', 'Gyokz', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}>
              Posez-moi n'importe quelle question
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleSuggestionClick("Explique-moi l'IA")}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#374151',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f9fafb'
                  e.target.style.borderColor = '#e5e5e5'
                }}
              >
                Explique-moi l'IA
              </button>
              <button
                onClick={() => handleSuggestionClick("Aide-moi à coder")}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#374151',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f9fafb'
                  e.target.style.borderColor = '#e5e5e5'
                }}
              >
                Aide-moi à coder
              </button>
              <button
                onClick={() => handleSuggestionClick("Inspire-moi")}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#374151',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.borderColor = '#d1d5db'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f9fafb'
                  e.target.style.borderColor = '#e5e5e5'
                }}
              >
                Inspire-moi
              </button>
            </div>
          </div>
        )}

        {/* Messages - always display if there are any */}
        {messages.map((msg, idx) => {
          // INLINE CLEANING - Remove all encoding issues
          const cleanText = (msg.content || '')
            .replace(/"""/g, '"')      // Remove triple quotes
            .replace(/""/g, '"')        // Remove double quotes
            .replace(/\\n/g, '\n')      // Fix literal \n
            .replace(/\\"/g, '"')       // Fix escaped quotes
            .replace(/\*\*/g, '')       // Remove bold markers
            .replace(/`/g, '')          // Remove code markers
            .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) =>
              String.fromCharCode(parseInt(code, 16))
            )                           // Decode Unicode sequences

          return (
            <div
              key={idx}
              style={{
                width: '100%',
                maxWidth: '700px',
                padding: '12px 16px',
                margin: '8px 0',
                borderRadius: '8px',
                background: msg.role === 'user' ? '#3B82F6' : '#F3F4F6',
                color: msg.role === 'user' ? 'white' : '#1F2937',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.7'
              }}
            >
              {cleanText}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isThinking && (
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '16px',
            background: '#f7f7f7',
            borderRadius: '8px',
            alignSelf: 'flex-start',
            maxWidth: '200px',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#666',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0s'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#666',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.16s'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#666',
                animation: 'bounce 1.4s infinite ease-in-out both',
                animationDelay: '0.32s'
              }} />
            </div>
            <span style={{ color: '#666', fontSize: '14px' }}>Zyron réfléchit...</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>

      {/* INPUT BOX - FORCE VISIBLE AT BOTTOM */}
      <div style={{
        width: '100%',
        padding: '16px',
        background: 'white',
        borderTop: '1px solid #e5e5e5',
        display: 'flex',
        gap: '8px',
        position: 'sticky',
        bottom: 0,
        zIndex: 50
      }}>
        <input
          type="text"
          placeholder="Ask Zyron..."
          value={localMessage}
          onChange={(e) => setLocalMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #d0d0d0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: '#f5f5f5',
            color: '#1a1a1a'
          }}
        />
        <button
          onClick={handleSend}
          disabled={!localMessage.trim() || isThinking}
          style={{
            padding: '12px 24px',
            background: isThinking ? '#999999' : '#cbcbcb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isThinking ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !isThinking && (e.target.style.background = '#b8b8b8')}
          onMouseLeave={(e) => !isThinking && (e.target.style.background = '#cbcbcb')}
        >
          {isThinking ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
