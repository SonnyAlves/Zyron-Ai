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
    setLocalMessage(textarea.value)

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Set new height based on content (min 44px, max 200px)
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 200)
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
    onSendMessage(localMessage)
    setLocalMessage('')

    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px'
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
            border-color: #3B82F6;
            background: #FFFFFF;
          }

          /* Scrollbar styling for messages */
          .messages-container {
            -webkit-overflow-scrolling: touch; /* iOS smooth scroll */
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

          /* ════════════════════════════════════════
             MOBILE RESPONSIVE STYLES
             ════════════════════════════════════════ */

          @media (max-width: 767px) {
            /* Hide scrollbar on mobile for more space */
            .messages-container::-webkit-scrollbar {
              display: none;
            }
            .messages-container {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }

            /* iOS keyboard handling */
            .input-container-mobile {
              padding-bottom: env(safe-area-inset-bottom, 12px);
              position: sticky;
              bottom: 0;
              z-index: 10;
            }

            /* Mobile logo spacing */
            .logo-container-mobile {
              padding: 12px 16px !important;
            }

            /* Mobile messages spacing */
            .messages-section-mobile {
              padding: 8px !important;
            }

            /* Input on mobile - more prominent */
            .mobile-input {
              border: 2px solid #E0E0E0 !important;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            }

            .mobile-input:focus {
              border-color: #3B82F6 !important;
              box-shadow: 0 2px 12px rgba(59, 130, 246, 0.15) !important;
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
              height: isMobile ? '36px' : '32px', // Slightly bigger on mobile
            }}
          />
        </div>

        {/* 2. MESSAGES ZONE - MIDDLE (large white box) */}
        <div className="messages-section-mobile" style={styles.messagesSection}>
          <div className="messages-container" style={styles.messagesContainer}>
            {/* Error Display */}
            {error && (
              <div style={styles.errorContainer}>
                <div style={styles.errorIcon}>⚠️</div>
                <div style={styles.errorMessage}>
                  <strong>Erreur:</strong> {error}
                </div>
              </div>
            )}

            {/* Thinking indicator */}
            {isThinking && (
              <div style={styles.thinkingIndicator}>
                <span style={styles.spinner}>⚙️</span> Zyron réfléchit...
              </div>
            )}

            {/* Response text */}
            {response && (
              <p style={styles.messageText}>{response}</p>
            )}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 3. INPUT ZONE - BOTTOM (fixed with gray bg) */}
        <div className="input-container-mobile" style={styles.inputContainer}>
          <textarea
            className="mobile-input"
            ref={textareaRef}
            value={localMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Zyron"
            style={{
              ...styles.messageInput,
              fontSize: isMobile ? '16px' : '14px', // 16px on mobile to prevent iOS zoom
              minHeight: isMobile ? '60px' : '48px',
            }}
            disabled={isThinking}
          />
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

  // 2. MESSAGES ZONE - MIDDLE (large white box section)
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
  messageText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    lineHeight: '1.6',
    color: '#1A1A1A',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
  },

  // 3. INPUT ZONE - BOTTOM (fixed with light gray background)
  inputContainer: {
    padding: '12px',
    background: '#F5F5F5',
    borderTop: 'none',
  },
  messageInput: {
    width: '100%',
    minHeight: '48px',
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

  // Loading indicator
  thinkingIndicator: {
    fontSize: '12px',
    color: '#666666',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
    fontFamily: "'Inter', sans-serif",
  },
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
