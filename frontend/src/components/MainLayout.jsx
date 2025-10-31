import { useState, useEffect, useRef } from 'react'
import VisualBrain from './VisualBrain' // ✅ RESTORED - Real Three.js component
import Header from './Header'
import Sidebar from './Sidebar/Sidebar'
import ChatPanelContent from './ChatPanelContent'
import { useAppInitialization } from '../hooks/useAppInitialization'
import { useStore } from '../store/useStore'
import { apiService } from '../services/apiService'
// import './MainLayout.css' // ❌ DISABLED - Using inline styles only

export default function MainLayout() {
  const { isInitialized, user } = useAppInitialization()
  const [isThinking, setIsThinking] = useState(false)
  const [tokens, setTokens] = useState([])
  const [response, setResponse] = useState('')
  const [message, setMessage] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768) // Detect mobile
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(window.innerWidth > 768)  // Sidebar closed on mobile, open on desktop
  const [visualBrainWidth, setVisualBrainWidth] = useState(835) // Resizable width, default 835px (balanced with chat)
  const [isResizing, setIsResizing] = useState(false)
  const isDragging = useRef(false) // Track if user is dragging (ref to avoid re-renders)
  const dragTimeout = useRef(null) // Timeout to re-enable auto-resize after drag
  const visualBrainRef = useRef(null)
  const lastTokenTriggerTime = useRef(0) // Throttle addToken calls

  // Zustand store (SIMPLIFIED - No workspaces)
  const {
    conversations,
    currentConversationId,
    messages,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    updateConversation,
    addMessageLocal,
    updateLastMessage,
    loadMessages,
  } = useStore()

  const handleSendMessage = async (messageText) => {
    console.log('🔵 handleSendMessage called with:', messageText)
    console.log('🔵 currentConversationId:', currentConversationId)

    // Auto-create conversation if none exists
    if (!currentConversationId && user) {
      console.log('📦 No conversation selected, auto-creating one...')
      try {
        const newConv = await createConversation(user.id, 'Nouvelle conversation')
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

      // 1. Add user message to LOCAL store immediately (optimistic UI)
      // Backend will handle Supabase persistence
      console.log('📝 Adding user message to local state...')
      addMessageLocal(finalConversationId, 'user', messageText)
      console.log('✅ User message added to local state')

      // 2. Add empty assistant message to state (will be updated during streaming)
      addMessageLocal(finalConversationId, 'assistant', '')

      // 3. Call API and stream response (backend handles Supabase persistence)
      const payload = {
        message: messageText,
        user_id: user?.id,
        conversation_id: finalConversationId,
      }

      console.log('📤 Sending payload to API:', payload)

      const res = await apiService.sendChatMessageStream(payload)

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
            // Parse JSON to properly decode text
            const jsonStr = line.slice(6)
            try {
              const parsed = JSON.parse(jsonStr)
              
              // Check if it's a structured response with text, clarification, graph_update
              let text = ''
              let graphUpdate = null
              
              if (typeof parsed === 'object' && parsed !== null) {
                // Structured response from backend
                text = parsed.text || ''
                graphUpdate = parsed.graph_update || null
              } else {
                // Simple string response
                text = parsed
              }
              
              if (text) {
                fullResponse += text
                setResponse((prev) => prev + text)
                setTokens((prev) => [...prev, text])

                // Update last message (assistant) in real-time
                updateLastMessage(fullResponse)

                // Activate Visual Brain nodes (throttled to every 2 seconds)
                const now = Date.now()
                if (now - lastTokenTriggerTime.current > 2000) {
                  visualBrainRef.current?.addToken(text)
                  lastTokenTriggerTime.current = now
                }
              }

              // Handle graph updates (animate nodes)
              if (graphUpdate && visualBrainRef.current) {
                // NOTE: Removed applyActivations to avoid conflicts with popcorn effect
                // The addToken method above already handles node activation
                
                // Add new nodes if needed
                if (graphUpdate.new_nodes && Array.isArray(graphUpdate.new_nodes)) {
                  graphUpdate.new_nodes.forEach(node => {
                    console.log('📊 New node from backend:', node)
                  })
                }
              }
            } catch (e) {
              // Fallback for non-JSON data
              const text = jsonStr
              if (text) {
                fullResponse += text
                setResponse((prev) => prev + text)
                setTokens((prev) => [...prev, text])
                updateLastMessage(fullResponse)

                // Activate Visual Brain nodes (throttled to every 2 seconds)
                const now = Date.now()
                if (now - lastTokenTriggerTime.current > 2000) {
                  visualBrainRef.current?.addToken(text)
                  lastTokenTriggerTime.current = now
                }
              }
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const jsonStr = buffer.slice(6)
        try {
          const parsed = JSON.parse(jsonStr)
          
          // Check if it's a structured response with text, clarification, graph_update
          let text = ''
          let graphUpdate = null

          if (typeof parsed === 'object' && parsed !== null) {
            // Structured response from backend
            text = parsed.text || ''
            graphUpdate = parsed.graph_update || null
          } else {
            // Simple string response
            text = parsed
          }

          if (text) {
            fullResponse += text
            setResponse((prev) => prev + text)
            setTokens((prev) => [...prev, text])
            updateLastMessage(fullResponse)

            // Activate Visual Brain nodes (throttled to every 2 seconds)
            const now = Date.now()
            if (now - lastTokenTriggerTime.current > 2000) {
              visualBrainRef.current?.addToken(text)
              lastTokenTriggerTime.current = now
            }
          }
          
          // Handle graph updates (animate nodes)
          if (graphUpdate && visualBrainRef.current) {
            // Activate nodes based on graph_update
            if (graphUpdate.activate_nodes && Array.isArray(graphUpdate.activate_nodes)) {
              const activations = graphUpdate.activate_nodes.map(nodeId => ({
                nodeId: nodeId,
                energyDelta: 0.2
              }))
              visualBrainRef.current.applyActivations(activations)
            }
            
            // Add new nodes if needed
            if (graphUpdate.new_nodes && Array.isArray(graphUpdate.new_nodes)) {
              graphUpdate.new_nodes.forEach(node => {
                console.log('📊 New node from backend:', node)
              })
            }
          }
        } catch (e) {
          const text = jsonStr
          if (text) {
            fullResponse += text
            setResponse((prev) => prev + text)
            setTokens((prev) => [...prev, text])
            updateLastMessage(fullResponse)

            // Activate Visual Brain nodes (throttled to every 2 seconds)
            const now = Date.now()
            if (now - lastTokenTriggerTime.current > 2000) {
              visualBrainRef.current?.addToken(text)
              lastTokenTriggerTime.current = now
            }
          }
        }
      }

      console.log('✅ Streaming complete')
      console.log('💾 Backend has saved messages to Supabase')

      // 4. Reload messages from Supabase to get the persisted data with proper IDs
      console.log('🔄 Reloading messages from Supabase...')
      await loadMessages(finalConversationId)
      console.log('✅ Messages reloaded from Supabase')

    } catch (error) {
      console.error('❌ Error:', error)
      const errorMsg = `Error: ${error.message}`
      setResponse(errorMsg)
      // Update last message with error
      updateLastMessage(errorMsg)
    } finally {
      setIsThinking(false)
    }
  }

  // Conversation handlers (SIMPLIFIED - No workspaces)
  const handleNewChat = async () => {
    if (user) {
      await createConversation(user.id, 'Nouvelle conversation')
      setMessage('')
      setResponse('')
      setTokens([])
      // Don't auto-close sidebar on desktop - only on mobile
      if (window.innerWidth < 768) {
        setConversationSidebarOpen(false)
      }
    }
  }

  const handleSelectConversation = async (conversation) => {
    // Extract ID from conversation object (support both object and string for backwards compatibility)
    const conversationId = typeof conversation === 'string' ? conversation : conversation.id
    
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
    // Get current conversation title
    const currentConv = conversations.find(c => c.id === conversationId)
    const currentTitle = currentConv?.title || ''

    // Prompt for new title
    const newTitle = prompt('Rename conversation:', currentTitle)

    if (newTitle && newTitle.trim() && newTitle !== currentTitle) {
      console.log('🔄 Renaming conversation:', conversationId, 'to:', newTitle)
      await updateConversation(conversationId, { title: newTitle.trim() })
      console.log('✅ Conversation renamed successfully')
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

    // Clamp between min (300px) and max (1200px) - extended max for more flexibility
    const clampedWidth = Math.max(300, Math.min(1200, newWidth))
    setVisualBrainWidth(clampedWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)

    // Wait 500ms before allowing auto-resize again (prevents jump)
    dragTimeout.current = setTimeout(() => {
      isDragging.current = false
    }, 500)
  }

  // No more workspaces needed

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

  // Mobile detection - listen to resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

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

      {/* Workspace Sidebar removed - Simplified architecture */}

      {/* MAIN CONTENT - 3 COLUMNS (responsive) */}
      <div className="main-content-wrapper" style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        marginTop: isMobile ? '56px' : '64px'
      }}>
        {/* Column 1: Sidebar - 280px or hidden */}
        {conversationSidebarOpen && (
          <div style={{
            width: '280px',
            height: '100%',
            flexShrink: 0,
            overflow: 'auto',
            border: 'none',
            borderRight: 'none',
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

        {/* Column 2: Chat - Flexible (full width on mobile) */}
        <div className="chat-column" style={{
          flex: 1,
          height: '100%',
          minWidth: 0,
          overflow: 'auto',
          background: 'white',
          width: isMobile ? '100%' : 'auto',
          border: 'none',
          borderRight: 'none'
        }}>
          <ChatPanelContent
            message={message}
            response={response}
            isThinking={isThinking}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* RESIZE HANDLE - Invisible draggable divider between Chat and Graph */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: 'white',
              flexShrink: 0,
              position: 'relative',
              zIndex: 10,
              userSelect: 'none'
            }}
          />
        )}

        {/* Column 3: Visual Brain - Hidden on mobile */}
        {!isMobile && (
          <div style={{
            width: `${visualBrainWidth}px`,
            height: '100%',
            flexShrink: 0,
            overflow: 'hidden',
            background: '#F7F7F7',
            transition: isResizing ? 'none' : 'width 0.3s ease',
            border: 'none',
            borderLeft: 'none'
          }}>
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
