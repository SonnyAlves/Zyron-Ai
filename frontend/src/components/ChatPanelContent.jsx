import { useState, useRef, useEffect } from 'react'
import ZyronLogo from './ZyronLogo'

export default function ChatPanelContent({
  message,
  response,
  isThinking,
  onSendMessage,
  error,
}) {
  const [localMessage, setLocalMessage] = useState(message)
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

          /* Scrollbar styling for messages */
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
        `}
      </style>

      {/* Vertical 3-zone layout */}
      <div style={styles.chatPanel}>
        {/* 1. LOGO ZONE - TOP */}
        <div style={styles.logoContainer}>
          <ZyronLogo size="md" />
          <span style={styles.logoText}>Zyron</span>
        </div>

        {/* 2. MESSAGES ZONE - MIDDLE (scrollable) */}
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

          {/* Messages */}
          {response && (
            <div style={styles.message}>
              {isThinking && (
                <div style={styles.thinkingIndicator}>
                  <span style={styles.spinner}>⚙️</span> Zyron réfléchit...
                </div>
              )}
              <p style={styles.messageText}>{response}</p>
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. INPUT ZONE - BOTTOM (fixed) */}
        <div style={styles.inputContainer}>
          <div style={styles.inputWrapper}>
            <textarea
              ref={textareaRef}
              value={localMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask Zyron"
              style={styles.messageInput}
              disabled={isThinking}
            />
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
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #E0E0E0',
  },
  logoText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '20px',
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // 2. MESSAGES ZONE - MIDDLE (scrollable)
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Message bubble styling
  message: {
    marginBottom: '16px',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    background: '#FFFFFF',
    border: '1px solid #E0E0E0',
    maxWidth: '85%',
    fontFamily: "'Inter', sans-serif",
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

  // 3. INPUT ZONE - BOTTOM (fixed)
  inputContainer: {
    padding: '16px',
    borderTop: '1px solid #E0E0E0',
    background: '#F5F5F5',
  },
  inputWrapper: {
    background: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
  },
  messageInput: {
    width: '100%',
    minHeight: '80px',
    padding: '16px',
    border: 'none',
    background: 'transparent',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    color: '#1A1A1A',
    resize: 'none',
    outline: 'none',
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
    borderRadius: '12px',
    color: '#856404',
    fontSize: '13px',
    marginBottom: '16px',
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
