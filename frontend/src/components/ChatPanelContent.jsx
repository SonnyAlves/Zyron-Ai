import { useState, useRef, useEffect } from 'react'
import MessageWithCopy from './MessageWithCopy'

export default function ChatPanelContent({
  message,
  response,
  isThinking,
  onSendMessage,
  error,
  currentConversationId,
  conversationMessages,
  onUpdateConversation,
}) {
  const [localMessage, setLocalMessage] = useState(message)
  const [isMobile, setIsMobile] = useState(false)
  const [messages, setMessages] = useState(conversationMessages || [])
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Load conversation messages when conversation changes
  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages)
    }
  }, [currentConversationId, conversationMessages])

  // Save messages to conversation whenever they change
  useEffect(() => {
    if (currentConversationId && messages.length > 0 && onUpdateConversation) {
      onUpdateConversation(currentConversationId, messages)
    }
  }, [messages])

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

    // Set new height based on content (min 32px on mobile, 44px desktop, max 120px)
    const minHeight = isMobile ? 32 : 44
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), 120)
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
      textareaRef.current.style.height = isMobile ? '32px' : '44px'
    }
  }

  const handleSuggestedPrompt = (prompt) => {
    setMessages(prev => [...prev, { type: 'user', text: prompt }])
    onSendMessage(prompt)
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

          /* Desktop placeholder - centered */
          textarea::placeholder {
            color: #9CA3AF;
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
            margin-left: 0;
          }

          .message.user {
            background: #3B82F6;
            color: white;
            border-radius: 18px 18px 4px 18px;
            margin-left: auto;
            margin-right: 0;
          }

          /* Empty state */
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px 24px;
            height: 100%;
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
            margin: 0 0 32px 0;
            font-family: 'Inter', sans-serif;
          }

          .suggested-prompts {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-width: 320px;
          }

          .suggested-prompts button {
            padding: 16px 20px;
            background: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            text-align: center;
            color: #374151;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: 'Inter', sans-serif;
          }

          .suggested-prompts button:hover {
            background: #F3F4F6;
            border-color: #D1D5DB;
          }

          .suggested-prompts button:active {
            background: #F3F4F6;
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

          /* Logo - desktop */
          .logo-full {
            height: 80px;
            width: auto;
            object-fit: contain;
            display: block;
          }

          .logo-container-mobile {
            background: #F5F5F5;
            border-bottom: 1px solid #E5E7EB;
          }

          /* Icon button (desktop - hidden by default) */
          .input-actions-left {
            display: none;
          }

          .icon-button {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: none;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #6B7280;
            padding: 0;
            transition: background 0.15s;
          }

          .icon-button:active {
            background: #E5E7EB;
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

            /* Logo - compact zone on mobile */
            .logo-container-mobile {
              padding: 24px 20px !important;
              border-bottom: 1px solid #E5E7EB !important;
              background: #F5F5F5 !important;
              position: relative !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 12px !important;
            }

            .logo-container-mobile img {
              height: 144px !important;
              width: auto !important;
              object-fit: contain !important;
            }

            /* Center messages when empty */
            .messages-container-empty {
              display: flex;
              flex-direction: column;
              justify-content: center;
              min-height: calc(100vh - 200px);
            }

            /* Messages with content - normal scroll */
            .messages-container-with-content {
              justify-content: flex-start;
              padding-bottom: 100px !important;
            }

            /* Input container - Claude-style layout */
            .input-container-mobile {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 12px 16px !important;
              padding-bottom: calc(12px + env(safe-area-inset-bottom)) !important;
              background: #FFFFFF !important;
              border-top: 1px solid #E5E7EB !important;
              z-index: 10;
            }

            /* Input wrapper - gray background with icons */
            .input-wrapper {
              background: #F3F4F6;
              border-radius: 24px;
              padding: 8px 8px 8px 12px;
              align-items: flex-end;
              gap: 8px;
            }

            /* Show left actions on mobile */
            .input-actions-left {
              display: flex;
              gap: 4px;
              padding-bottom: 4px;
            }

            /* Message input - transparent on mobile */
            .mobile-input {
              flex: 1;
              min-height: 32px !important;
              max-height: 120px !important;
              padding: 6px 8px !important;
              border: none !important;
              background: transparent !important;
              font-size: 16px !important;
              color: #1F2937 !important;
              resize: none;
              outline: none;
            }

            .mobile-input::placeholder {
              color: #9CA3AF !important;
              text-align: left !important;
            }

            /* Send button on mobile - smaller */
            .send-button {
              width: 32px;
              height: 32px;
              min-width: 32px;
              min-height: 32px;
            }

            .send-button:disabled {
              background: #D1D5DB;
              color: #9CA3AF;
            }

            .send-button:active:not(:disabled) {
              background: #2563EB;
            }

            /* Message bubbles on mobile */
            .message {
              font-size: 16px;
              line-height: 1.5;
              padding: 12px 16px;
              margin-bottom: 16px;
              max-width: 85%;
            }

            /* Empty state on mobile */
            .empty-state {
              padding: 32px 24px 60px 24px;
              min-height: calc(100vh - 250px);
            }

            .empty-state h2 {
              font-size: 24px;
            }

            .empty-state p {
              font-size: 16px;
              margin-bottom: 32px;
            }

            .suggested-prompts {
              max-width: 320px;
              margin-bottom: 0;
            }
          }
        `}
      </style>

      {/* Vertical 3-zone layout */}
      <div style={styles.chatPanel}>
        {/* 1. LOGO ZONE - TOP */}
        <div className="logo-container-mobile" style={styles.logoContainer}>
          <img
            src="/zyron-logo-mobile.png"
            alt="Zyron Ai"
            className="logo-full"
            style={styles.logoImage}
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

            {/* Empty State - NO EMOJIS */}
            {!hasMessages && (
              <div className="empty-state">
                <h2>Bienvenue sur Zyron AI</h2>
                <p>Posez-moi n'importe quelle question</p>
                <div className="suggested-prompts">
                  <button onClick={() => handleSuggestedPrompt("Explique-moi l'IA")}>
                    Explique-moi l'IA
                  </button>
                  <button onClick={() => handleSuggestedPrompt("Aide-moi à coder")}>
                    Aide-moi à coder
                  </button>
                  <button onClick={() => handleSuggestedPrompt("Inspire-moi")}>
                    Inspire-moi
                  </button>
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg, idx) => (
              <MessageWithCopy key={idx} message={msg} />
            ))}

            {/* Thinking indicator - removed per user request */}

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 3. INPUT ZONE - BOTTOM - Claude-style layout */}
        <div className="input-container-mobile" style={styles.inputContainer}>
          <div className="input-wrapper">
            {/* Left actions - only visible on mobile */}
            <div className="input-actions-left">
              <button className="icon-button" aria-label="Ajouter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              className="mobile-input"
              ref={textareaRef}
              value={localMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? "Message à Zyron" : "Ask Zyron"}
              style={styles.messageInput}
              disabled={isThinking}
            />

            {/* Send button - right */}
            <button
              className="send-button"
              onClick={handleSend}
              disabled={!localMessage.trim() || isThinking}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
    justifyContent: 'center',
    background: '#F5F5F5',
    borderBottom: '1px solid #E5E7EB',
  },
  logoImage: {
    height: '80px',
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
