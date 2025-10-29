import { useState, useRef, useCallback, Suspense, lazy } from 'react'
import { useStreamingChat } from '../hooks/useStreamingChat'
import { useClerk } from '@clerk/clerk-react'
import MessageContent from './MessageContent'

const VisualBrain = lazy(() => import('./VisualBrain'))

// Use Vercel Serverless Function in production, local backend in development
const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8001')

// DEBUG: Log API URL being used
console.log('🔧 API_URL configured:', API_URL)
console.log('🔧 VITE_BACKEND_URL env:', import.meta.env.VITE_BACKEND_URL)
console.log('🔧 Is production?', import.meta.env.PROD)

/**
 * Guest chat layout with message limit
 * Simple 2-column layout: Chat + Visual Brain
 */
export default function GuestChatLayout({ onBeforeSend, remainingMessages }) {
  const [messages, setMessages] = useState([])
  const [tokens, setTokens] = useState([])
  const [inputValue, setInputValue] = useState('')
  const visualBrainRef = useRef(null)
  const { openSignUp } = useClerk()

  const { isLoading, error, sendMessage, abort } = useStreamingChat(API_URL)

  const showWarning = remainingMessages !== null && remainingMessages <= 3
  const showWelcome = messages.length === 0 && !isLoading

  /**
   * Handle send message (with limit check)
   */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    // Check limit BEFORE sending
    const canSend = onBeforeSend()
    if (!canSend) return // Blocked by limit

    const userMessage = inputValue.trim()
    setInputValue('')
    setTokens([])

    // Add user message immediately
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    // Stream response from backend
    await sendMessage(
      userMessage,
      // onChunk: track tokens for visual brain
      (token) => {
        setTokens((prev) => [...prev, token])
        visualBrainRef.current?.addToken(token)
      },
      // onComplete: add assistant message
      (fullContent) => {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      },
      // onError: handle errors
      (err) => {
        console.error('Streaming error:', err)
      }
    )
  }, [inputValue, isLoading, onBeforeSend, sendMessage])

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback(async (suggestion) => {
    if (isLoading) return

    // Check limit BEFORE sending
    const canSend = onBeforeSend()
    if (!canSend) return // Blocked by limit

    setInputValue('')
    setTokens([])

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: suggestion,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])

    // Stream response
    await sendMessage(
      suggestion,
      (token) => {
        setTokens((prev) => [...prev, token])
        visualBrainRef.current?.addToken(token)
      },
      (fullContent) => {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      },
      (err) => {
        console.error('Streaming error:', err)
      }
    )
  }, [isLoading, onBeforeSend, sendMessage])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f7f7f7' }}>
      {/* Header */}
      <div style={{
        height: '64px',
        background: 'white',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logos/zyron-logo.png" alt="Zyron AI" style={{ height: '32px' }} />
          <span style={{ fontSize: '20px', fontWeight: '400', color: '#1a1a1a', fontFamily: 'Gyokz, sans-serif' }}>Zyron AI</span>
          <span style={{
            padding: '4px 12px',
            background: '#FEF3C7',
            color: '#92400E',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            Guest Mode
          </span>
        </div>

        <button
          onClick={() => openSignUp()}
          style={{
            padding: '8px 20px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#2563EB'}
          onMouseLeave={(e) => e.target.style.background = '#3B82F6'}
        >
          Sign Up - Free
        </button>
      </div>

      {/* Warning banner */}
      {showWarning && (
        <div style={{
          padding: '12px 24px',
          background: '#FEF3C7',
          borderBottom: '1px solid #FDE047',
          color: '#92400E',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ⚠️ {remainingMessages} message{remainingMessages !== 1 ? 's' : ''} remaining •{' '}
          <button
            onClick={() => openSignUp()}
            style={{
              background: 'none',
              border: 'none',
              color: '#92400E',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#78350F'
              e.target.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#92400E'
              e.target.style.textDecoration = 'underline'
            }}
          >
            Sign up for unlimited
          </button>
        </div>
      )}

      {/* Main content - 2 columns */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat panel - 40% */}
        <div style={{
          width: '40%',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          borderRight: '1px solid #e5e5e5'
        }}>
          {/* Messages area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Welcome screen */}
            {showWelcome && (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                  <h1 style={{
                    fontSize: '28px',
                    marginBottom: '12px',
                    color: '#1F2937',
                    fontWeight: '400',
                    fontFamily: 'Gyokz, sans-serif'
                  }}>
                    Bienvenue sur Zyron AI
                  </h1>
                  <p style={{
                    color: '#6B7280',
                    marginBottom: '24px',
                    fontSize: '16px'
                  }}>
                    Posez-moi n'importe quelle question
                  </p>

                  <p style={{
                    color: '#10B981',
                    marginBottom: '24px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    ✨ 10 messages gratuits pour tester
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
                        fontWeight: '500'
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
                        fontWeight: '500'
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
                        fontWeight: '500'
                      }}
                    >
                      Inspire-moi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => {
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
                  key={msg.id}
                  style={{
                    padding: '12px 16px',
                    marginBottom: '12px',
                    borderRadius: '8px',
                    background: msg.role === 'user' ? '#3B82F6' : '#F3F4F6',
                    color: msg.role === 'user' ? 'white' : '#1F2937',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.7'
                  }}
                >
                  {cleanText}
                </div>
              );
            })}

            {/* Error message */}
            {error && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '12px',
                borderRadius: '8px',
                background: '#FEE2E2',
                color: '#991B1B'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{
                padding: '12px 16px',
                marginBottom: '12px',
                borderRadius: '8px',
                background: '#f7f7f7',
                color: '#666',
                alignSelf: 'flex-start'
              }}>
                Zyron réfléchit...
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e5e5',
            background: 'white'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Message Zyron AI..."
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#f5f5f5',
                  color: '#1a1a1a',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
              {isLoading ? (
                <button
                  onClick={abort}
                  style={{
                    padding: '12px 20px',
                    background: '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ⏹
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  style={{
                    padding: '12px 20px',
                    background: inputValue.trim() ? '#3B82F6' : '#d0d0d0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ↑
                </button>
              )}
            </div>

            {/* Message counter */}
            {remainingMessages !== null && (
              <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: remainingMessages <= 3 ? '#DC2626' : '#6B7280',
                textAlign: 'center'
              }}>
                {remainingMessages} message{remainingMessages !== 1 ? 's' : ''} remaining
              </div>
            )}
          </div>
        </div>

        {/* Visual Brain - 60% */}
        <div style={{ flex: 1, background: '#F7F7F7' }}>
          <Suspense fallback={<div style={{ height: '100%', width: '100%', background: '#F7F7F7' }} />}>
            <VisualBrain
              ref={visualBrainRef}
              isThinking={isLoading}
              tokens={tokens}
              onNodeClick={(node) => console.log('Node clicked:', node)}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
