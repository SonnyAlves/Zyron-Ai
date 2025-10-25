import { useState } from 'react'

export default function ChatPanelContent({
  message,
  response,
  isThinking,
  onSendMessage,
  onClearChat,
}) {
  const [localMessage, setLocalMessage] = useState(message)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSend()
    }
  }

  const handleSend = () => {
    if (!localMessage.trim()) return
    onSendMessage(localMessage)
    setLocalMessage('')
  }

  const handleClear = () => {
    setLocalMessage('')
    onClearChat()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Zyron AI</h2>
        <button
          onClick={handleClear}
          style={styles.clearButton}
          title="Clear conversation"
        >
          Clear
        </button>
      </div>

      <textarea
        value={localMessage}
        onChange={(e) => setLocalMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask Zyron anything... (Ctrl+Enter to send)"
        style={styles.textarea}
        disabled={isThinking}
      />

      <button
        onClick={handleSend}
        disabled={isThinking || !localMessage.trim()}
        style={{
          ...styles.sendButton,
          opacity: isThinking || !localMessage.trim() ? 0.6 : 1,
          backgroundColor: isThinking || !localMessage.trim() ? '#A7B6C2' : '#2D72D2',
          cursor: isThinking || !localMessage.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        {isThinking ? 'Thinking...' : 'Send'}
      </button>

      <div style={styles.responseContainer}>
        <div style={styles.responseLabel}>
          <span>Zyron's Response</span>
          {isThinking && <span style={styles.thinkingIndicator}>streaming...</span>}
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
    padding: '24px',
    gap: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: 'transparent',
    color: '#182026',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E8EB',
    paddingBottom: '16px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '400',
    color: '#182026',
    letterSpacing: '-0.02em',
    fontFamily: "'Gyokz', sans-serif",
  },
  clearButton: {
    background: 'transparent',
    border: '1px solid #CED9E0',
    color: '#5C7080',
    padding: '6px 14px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  textarea: {
    flex: '0 0 100px',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #CED9E0',
    backgroundColor: '#FFFFFF',
    color: '#182026',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  sendButton: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#2D72D2',
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
    fontSize: '11px',
    fontWeight: '600',
    color: '#738694',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  thinkingIndicator: {
    fontSize: '11px',
    color: '#2D72D2',
    animation: 'pulse 1.5s infinite',
  },
  responseBox: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #E5E8EB',
    overflowY: 'auto',
    minHeight: 0,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  responseText: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    lineHeight: '1.6',
    color: '#182026',
    fontSize: '13px',
  },
  placeholderText: {
    margin: 0,
    color: '#A7B6C2',
    fontStyle: 'italic',
  },
}
