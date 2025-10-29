import { useState, useEffect, useRef } from 'react'
import VisualBrain from './VisualBrain' // ✅ RESTORED - Real Three.js component
import Header from './Header'
import Sidebar from './Sidebar/Sidebar'
import ChatPanelContent from './ChatPanelContent'
import WorkspaceSidebar from './WorkspaceSidebar'
import { useAppInitialization } from '../hooks/useAppInitialization'
import { useStore } from '../store/useStore'
// import './MainLayout.css' // ❌ DISABLED - Using inline styles only

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function MainLayout() {
  const { isInitialized, user } = useAppInitialization()
  const [isThinking, setIsThinking] = useState(false)
  const [tokens, setTokens] = useState([])
  const [response, setResponse] = useState('')
  const [message, setMessage] = useState('')
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false)
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(true)  // Sidebar visible by default
  const [visualBrainWidth, setVisualBrainWidth] = useState(835) // Resizable width, default 835px (balanced with chat)
  const [isResizing, setIsResizing] = useState(false)
  const isDragging = useRef(false) // Track if user is dragging (ref to avoid re-renders)
  const dragTimeout = useRef(null) // Timeout to re-enable auto-resize after drag
  const visualBrainRef = useRef(null)

  // Zustand store
  const {
    workspaces,
    currentWorkspaceId,
    conversations,
    currentConversationId,
    messages,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setCurrentWorkspace,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    addMessage,
    loadMessages,
  } = useStore()

  const handleSendMessage = async (messageText) => {
    console.log('🔵 handleSendMessage called with:', messageText)
    console.log('🔵 currentConversationId:', currentConversationId)
    console.log('🔵 currentWorkspaceId:', currentWorkspaceId)

    // Auto-create conversation if none exists
    if (!currentConversationId && currentWorkspaceId && user) {
      console.log('📦 No conversation selected, auto-creating one...')
      try {
        const newConv = await createConversation(currentWorkspaceId, user.id, 'Nouvelle conversation')
        console.log('✅ Conversation auto-created:', newConv)

        // Wait for Zustand state to propagate
        await new Promise(resolve => setTimeout(resolve, 200))

        // Get fresh state from store
        const freshState = useStore.getState()
        console.log('🔄 Fresh currentConversationId after creation:', freshState.currentConversationId)

        // If still null, something went wrong
        if (!freshState.currentConversationId) {
          console.error('❌ Conversation created but not selected!')
          alert('Erreur lors de la création de la conversation. Veuillez réessayer.')
          return
        }
      } catch (error) {
        console.error('❌ Failed to create conversation:', error)
        alert('Erreur lors de la création de la conversation. Veuillez réessayer.')
        return
      }
    }

    // Get fresh state one more time before proceeding
    const finalState = useStore.getState()
    const finalConversationId = finalState.currentConversationId

    // Double-check after auto-creation
    if (!finalConversationId) {
      console.error('❌ No conversation selected!')
      alert('Veuillez créer une nouvelle conversation avant d\'envoyer un message.')
      return
    }

    console.log('🚀 Sending message to conversation:', finalConversationId)
    setMessage(messageText)

    try {
      setIsThinking(true)
      setResponse('')
      setTokens([])

      // 1. Add user message to store IMMEDIATELY
      console.log('📝 Adding user message to store...')
      await addMessage(finalConversationId, 'user', messageText)
      console.log('✅ User message added to store')

      // 2. Call API and stream response
      const res = await fetch(`${API_URL}/chat`, {
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
      let fullResponse = ''

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
              fullResponse += text
              setResponse((prev) => prev + text)
              setTokens((prev) => [...prev, text])
              // Activate Visual Brain nodes for each token
              console.log('🔵 About to call addToken with:', text)
              console.log('🔵 visualBrainRef.current exists?', !!visualBrainRef.current)
              console.log('🔵 visualBrainRef.current.addToken exists?', !!visualBrainRef.current?.addToken)
              visualBrainRef.current?.addToken(text)
            }
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        const text = buffer.slice(6)
        if (text) {
          fullResponse += text
          setResponse((prev) => prev + text)
          setTokens((prev) => [...prev, text])
          // Activate Visual Brain nodes for remaining buffer
          visualBrainRef.current?.addToken(text)
        }
      }

      // 3. Add assistant response to store
      console.log('📝 Adding assistant response to store...')
      await addMessage(finalConversationId, 'assistant', fullResponse)
      console.log('✅ Assistant response added to store')

    } catch (error) {
      console.error('❌ Error:', error)
      setResponse(`Error: ${error.message}`)
      // Add error message to store
      await addMessage(finalConversationId, 'assistant', `Error: ${error.message}`)
    } finally {
      setIsThinking(false)
    }
  }

  // Workspace handlers
  const handleCreateWorkspace = async (workspaceData) => {
    if (user) {
      await createWorkspace(user.id, workspaceData)
      setWorkspaceSidebarOpen(false)
    }
  }

  const handleSelectWorkspace = (workspaceId) => {
    setCurrentWorkspace(workspaceId)
    setWorkspaceSidebarOpen(false)
  }

  // Conversation handlers
  const handleNewChat = async () => {
    if (currentWorkspaceId && user) {
      await createConversation(currentWorkspaceId, user.id, 'Nouvelle conversation')
      setMessage('')
      setResponse('')
      setTokens([])
      // Don't auto-close sidebar on desktop - only on mobile
      if (window.innerWidth < 768) {
        setConversationSidebarOpen(false)
      }
    }
  }

  const handleSelectConversation = async (conversationId) => {
    console.log('🔄 Selecting conversation:', conversationId)
    setCurrentConversation(conversationId)
    setMessage('')
    setResponse('')
    setTokens([])

    // Load messages for this conversation
    await loadMessages(conversationId)
    console.log('✅ Messages loaded for conversation:', conversationId)

    // Don't auto-close sidebar on desktop - only on mobile
    if (window.innerWidth < 768) {
      setConversationSidebarOpen(false)
    }
  }

  const handleDeleteConversation = async (conversationId) => {
    await deleteConversation(conversationId)
  }

  const handleRenameConversation = async (conversationId) => {
    // For now, trigger a simple prompt
    // In future: use a modal component
    const newTitle = prompt('Rename conversation:', '')
    if (newTitle && newTitle.trim()) {
      // Update the conversation in store (would need updateConversation method)
      // For now, conversations are read-only after creation
      console.log('Rename conversation:', conversationId, 'to:', newTitle)
    }
  }

  // Sidebar toggle handler
  const handleToggleSidebar = () => {
    setConversationSidebarOpen(!conversationSidebarOpen)
  }

  // Resize handlers for Visual Brain width
  const handleMouseDown = () => {
    setIsResizing(true)
    isDragging.current = true // Mark as dragging (ref doesn't trigger re-render)

    // Clear any existing timeout
    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current)
    }
  }

  const handleMouseMove = (e) => {
    if (!isResizing) return

    // Calculate new width based on mouse position from right edge
    const newWidth = window.innerWidth - e.clientX

    // Clamp between min (300px) and max (900px)
    const clampedWidth = Math.max(300, Math.min(900, newWidth))
    setVisualBrainWidth(clampedWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)

    // Wait 500ms before allowing auto-resize again (prevents jump)
    dragTimeout.current = setTimeout(() => {
      isDragging.current = false
    }, 500)
  }

  // Get current workspace for header display
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

  // Auto-expand Visual Brain when sidebar closes (unless user is dragging)
  useEffect(() => {
    // Don't auto-resize if user is currently dragging or just finished dragging
    if (isDragging.current) return

    if (!conversationSidebarOpen) {
      // Sidebar closed → expand Visual Brain to 985px
      setVisualBrainWidth(985)
    } else {
      // Sidebar open → return to default 835px
      setVisualBrainWidth(835)
    }
  }, [conversationSidebarOpen])

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

  // Mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current)
      }
    }
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      console.log('🔄 Auto-loading messages for conversation:', currentConversationId)
      loadMessages(currentConversationId)
    }
  }, [currentConversationId])

  // Keyboard shortcuts: R (reset width), Escape (close sidebars)
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Escape key closes sidebars
      if (e.key === 'Escape') {
        setWorkspaceSidebarOpen(false)
        setConversationSidebarOpen(false)
        return
      }

      // Don't trigger shortcuts if user is typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      const key = e.key.toLowerCase()
      if (key === 'r') {
        // Reset Visual Brain width and re-enable auto-expand
        isDragging.current = false
        if (dragTimeout.current) {
          clearTimeout(dragTimeout.current)
        }
        setVisualBrainWidth(conversationSidebarOpen ? 835 : 985)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0F1419',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
          {/* Spinner */}
          <div style={{
            width: '48px',
            height: '48px',
            margin: '0 auto 24px',
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />

          {/* Title */}
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'white'
          }}>
            Chargement de vos données...
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '24px'
          }}>
            Configuration de votre workspace en cours
          </div>

          {/* Refresh button (if loading takes too long) */}
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            Rafraîchir la page
          </button>

          {/* CSS animation for spinner */}
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* HEADER - Fixed 64px */}
      <Header
        onSidebarToggle={handleToggleSidebar}
      />

      {/* Workspace Sidebar (toggle with overlay) */}
      {workspaceSidebarOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
            onClick={() => setWorkspaceSidebarOpen(false)}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '280px',
            background: 'white',
            zIndex: 1000,
            boxShadow: '2px 0 12px rgba(0, 0, 0, 0.15)'
          }}>
            <WorkspaceSidebar
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
              onSelectWorkspace={handleSelectWorkspace}
              onCreateWorkspace={handleCreateWorkspace}
              onUpdateWorkspace={updateWorkspace}
              onDeleteWorkspace={deleteWorkspace}
              onClose={() => setWorkspaceSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* MAIN CONTENT - 3 COLUMNS FORCED */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        marginTop: '64px'
      }}>
        {/* Column 1: Sidebar - 280px or hidden */}
        {conversationSidebarOpen && (
          <div style={{
            width: '280px',
            height: '100%',
            flexShrink: 0,
            overflow: 'auto',
            borderRight: '1px solid #e5e5e5',
            background: 'white'
          }}>
            <Sidebar
              conversations={conversations}
              activeConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewChat}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              isOpen={conversationSidebarOpen}
              onToggle={handleToggleSidebar}
            />
          </div>
        )}

        {/* Column 2: Chat - Flexible */}
        <div style={{
          flex: 1,
          height: '100%',
          minWidth: 0,
          overflow: 'auto',
          background: 'white'
        }}>
          <ChatPanelContent
            message={message}
            response={response}
            isThinking={isThinking}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* RESIZE HANDLE - Draggable divider */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '4px',
            cursor: 'col-resize',
            background: isResizing ? '#667eea' : '#e5e5e5',
            transition: isResizing ? 'none' : 'background 0.2s',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
            userSelect: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#667eea'}
          onMouseLeave={(e) => !isResizing && (e.currentTarget.style.background = '#e5e5e5')}
        >
          {/* Drag indicator (subtle hint) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '40px',
            background: 'rgba(102, 126, 234, 0.2)',
            borderRadius: '4px',
            pointerEvents: 'none',
            opacity: isResizing ? 1 : 0,
            transition: 'opacity 0.2s'
          }} />
        </div>

        {/* Column 3: Visual Brain - Auto-expands when sidebar closes */}
        <div style={{
          width: `${visualBrainWidth}px`,
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
          background: '#F7F7F7',
          transition: isResizing ? 'none' : 'width 0.3s ease'
        }}>
          <VisualBrain
            ref={visualBrainRef}
            isThinking={isThinking}
            tokens={tokens}
            onNodeClick={(node) => console.log('Node clicked:', node)}
          />
        </div>
      </div>
    </div>
  )
}
