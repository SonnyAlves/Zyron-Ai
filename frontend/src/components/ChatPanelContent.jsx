import { useState, useRef, useEffect } from 'react'

export default function ChatPanelContent({
  message,
  response,
  isThinking,
  onSendMessage,
  error,
}) {
  const [localMessage, setLocalMessage] = useState(message)
  const [isMobile, setIsMobile] = useState(false)
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // iOS keyboard handling - scroll to input when keyboard appears
  useEffect(() => {
    if (!isMobile) return

    const handleResize = () => {
      if (document.activeElement === textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }, 300)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  // Update messages when response changes
  useEffect(() => {
    if (response) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg && lastMsg.type === 'assistant') {
          // Update last assistant message
          return [...prev.slice(0, -1), { type: 'assistant', text: response }]
        }
        // Add new assistant message
        return [...prev, { type: 'assistant', text: response }]
      })
    }
  }, [response])

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (messages.length > 0 || isThinking) {
      scrollToBottom()
    }
  }, [messages, isThinking])

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    const textarea = e.target
    setLocalMessage(textarea.value)

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Set new height based on content (min 44px, max 120px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 120)
    textarea.style.height = `${newHeight}px`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (!localMessage.trim() || isThinking) return

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: localMessage }])

    onSendMessage(localMessage)
    setLocalMessage('')

    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }

  const handleSuggestedPrompt = (prompt) => {
    setLocalMessage(prompt)
    handleSend()
  }

  const hasMessages = messages.length > 0 || response || isThinking

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Center placeholder text */
          textarea::placeholder {
            color: #9E9E9E;
            text-align: center;
            font-weight: 400;
            font-family: 'Inter', sans-serif;
          }

          /* Input focus state */
          textarea:focus {
            outline: none;
          }

          /* Scrollbar styling for messages */
          .messages-container {
            -webkit-overflow-scrolling: touch;
          }
          .messages-container::-webkit-scrollbar {
            width: 6px;
          }
          .messages-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .messages-container::-webkit-scrollbar-thumb {
            background: #E0E0E0;
            border-radius: 3px;
          }
          .messages-container::-webkit-scrollbar-thumb:hover {
            background: #BDBDBD;
          }

          /* Message bubbles */
          .message {
            font-size: 15px;
            line-height: 1.5;
            padding: 12px 16px;
            margin-bottom: 12px;
            max-width: 85%;
            animation: fadeIn 0.3s ease-out;
            word-wrap: break-word;
          }

          .message.assistant {
            background: #F3F4F6;
            color: #1F2937;
            border-radius: 18px 18px 18px 4px;
            margin-right: auto;
          }

          .message.user {
            background: #3B82F6;
            color: white;
            border-radius: 18px 18px 4px 18px;
            margin-left: auto;
          }

          /* Empty state */
          .empty-state {
            text-align: center;
            padding: 40px 20px;
          }

          .empty-state-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }

          .empty-state h2 {
            font-size: 24px;
            font-weight: 700;
            color: #1F2937;
            margin: 0 0 8px 0;
            font-family: 'Inter', sans-serif;
          }

          .empty-state p {
            font-size: 16px;
            color: #6B7280;
            margin: 0 0 24px 0;
            font-family: 'Inter', sans-serif;
          }

          .suggested-prompts {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-width: 400px;
            margin: 0 auto;
          }

          .suggested-prompts button {
            padding: 12px 20px;
            background: #F3F4F6;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            font-size: 15px;
            text-align: left;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
          }

          .suggested-prompts button:hover {
            background: #E5E7EB;
            border-color: #D1D5DB;
          }

          .suggested-prompts button:active {
            background: #D1D5DB;
            transform: scale(0.98);
          }

          /* Send button */
          .send-button {
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            border-radius: 50%;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #3B82F6;
            color: white;
            border: none;
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.2s;
          }

          .send-button:hover:not(:disabled) {
            background: #2563EB;
            transform: scale(1.05);
          }

          .send-button:active:not(:disabled) {
            transform: scale(0.95);
          }

          .send-button:disabled {
            background: #E5E7EB;
            color: #9CA3AF;
            cursor: not-allowed;
          }

          .send-button svg {
            width: 20px;
            height: 20px;
          }

          .input-wrapper {
            display: flex;
            gap: 8px;
            align-items: flex-end;
          }

          /* ════════════════════════════════════════
             MOBILE RESPONSIVE STYLES
             ════════════════════════════════════════ */

          @media (max-width: 767px) {
            /* Hide scrollbar on mobile */
            .messages-container::-webkit-scrollbar {
              display: none;
            }
            .messages-container {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }

            /* Logo sticky at top */
            .logo-container-mobile {
              position: sticky;
              top: 0;
              z-index: 100;
              border-bottom: 1px solid #E5E7EB;
              background: #FFFFFF !important;
              padding: 16px !important;
            }

            /* Center messages when empty */
            .messages-container-empty {
              display: flex;
              flex-direction: column;
              justify-content: center;
              min-height: calc(100vh - 180px);
            }

            /* Messages with content - normal scroll */
            .messages-container-with-content {
              justify-content: flex-start;
            }

            /* Input container fixed at bottom */
            .input-container-mobile {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 16px !important;
              padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
              background: #FFFFFF !important;
              border-top: 1px solid #E5E7EB !important;
              z-index: 10;
            }

            /* Message bubbles on mobile */
            .message {
              font-size: 16px;
              padding: 12px 16px;
              max-width: 85%;
            }

            /* Input on mobile */
            .mobile-input {
              flex: 1;
              min-height: 44px !important;
              max-height: 120px;
              padding: 12px 16px !important;
              font-size: 16px !important;
              border-radius: 22px !important;
              border: 1px solid #E5E7EB !important;
              background: #F9FAFB !important;
            }

            .mobile-input:focus {
              border-color: #3B82F6 !important;
              background: #FFFFFF !important;
            }

            /* Empty state on mobile */
            .empty-state {
              padding: 20px;
            }

            .empty-state-icon {
              font-size: 48px;
            }

            .empty-state h2 {
              font-size: 20px;
            }

            .empty-state p {
              font-size: 14px;
            }
          }
        `}
      </style>

      {/* Vertical 3-zone layout */}
      <div style={styles.chatPanel}>
        {/* 1. LOGO ZONE - TOP */}
        <div className="logo-container-mobile" style={styles.logoContainer}>
          <img
            src="/zyron-logo.png"
            alt="Zyron Ai"
            style={{
              ...styles.logoImage,
              height: isMobile ? '32px' : '32px',
            }}
          />
        </div>

        {/* 2. MESSAGES ZONE - MIDDLE */}
        <div
          className="messages-section-mobile"
          style={{
            ...styles.messagesSection,
            paddingBottom: isMobile ? '80px' : '12px', // Space for fixed input on mobile
          }}
        >
          <div
            className={`messages-container ${hasMessages ? 'messages-container-with-content' : 'messages-container-empty'}`}
            style={styles.messagesContainer}
          >
            {/* Error Display */}
            {error && (
              <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>⚠️</div>
                <div style={styles.errorMessage}>
                  <strong>Erreur:</strong> {error}
                </div>
              </div>
            )}

            {/* Empty State with Suggestions */}
            {!hasMessages && (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <h2>Bienvenue sur Zyron AI</h2>
                <p>Posez-moi n'importe quelle question</p>
                <div className="suggested-prompts">
                  <button onClick={() => handleSuggestedPrompt("Explique-moi l'IA")}>
                    💡 Explique-moi l'IA
                  </button>
                  <button onClick={() => handleSuggestedPrompt("Aide-moi à coder")}>
                    💻 Aide-moi à coder
                  </button>
                  <button onClick={() => handleSuggestedPrompt("Inspire-moi")}>
                    ✨ Inspire-moi
                  </button>
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="message assistant">
                <span style={styles.spinner}>⚙️</span> Zyron réfléchit...
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 3. INPUT ZONE - BOTTOM */}
        <div className="input-container-mobile" style={styles.inputContainer}>
          <div className="input-wrapper">
            <textarea
              className="mobile-input"
              ref={textareaRef}
              value={localMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Zyron"
              style={styles.messageInput}
              disabled={isThinking}
            />
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!localMessage.trim() || isThinking}
            >
              {isThinking ? (
                <span style={styles.spinner}>⚙️</span>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  // Main chat panel container (vertical 3-zone layout)
  chatPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#F5F5F5',
    fontFamily: "'Inter', sans-serif",
  },

  // 1. LOGO ZONE - TOP
  logoContainer: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    background: '#FFFFFF',
  },
  logoImage: {
    height: '32px',
    width: 'auto',
    objectFit: 'contain',
  },

  // 2. MESSAGES ZONE - MIDDLE
  messagesSection: {
    flex: 1,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    background: '#F5F5F5',
  },
  messagesContainer: {
    flex: 1,
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E0E0E0',
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  // 3. INPUT ZONE - BOTTOM
  inputContainer: {
    padding: '12px',
    background: '#F5F5F5',
    borderTop: 'none',
  },
  messageInput: {
    width: '100%',
    minHeight: '44px',
    maxHeight: '120px',
    padding: '12px 16px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    background: '#FAFAFA',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    color: '#1A1A1A',
    resize: 'none',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
  },

  // Loading spinner
  spinner: {
    display: 'inline-block',
    animation: 'spin 2s linear infinite',
  },

  // Error display
  errorContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#FFF3CD',
    border: '1px solid #FFC107',
    borderRadius: '8px',
    color: '#856404',
    fontSize: '13px',
    marginBottom: '12px',
  },
  errorIcon: {
    fontSize: '18px',
    lineHeight: '1',
  },
  errorMessage: {
    flex: 1,
    lineHeight: '1.4',
    fontFamily: "'Inter', sans-serif",
  },
}
