import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { UserButton } from '@clerk/clerk-react'
const VisualBrain = lazy(() => import('./VisualBrain'))
import ChatPanelContent from './ChatPanelContent'
import ZyronLogo from './ZyronLogo'
import WorkspaceSidebar from './WorkspaceSidebar'
import Sidebar from './Sidebar/Sidebar'
import { useAppInitialization } from '../hooks/useAppInitialization'
import { useStore } from '../store/useStore'
import './MainLayout.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function MainLayout() {
  const { isInitialized, user } = useAppInitialization()
  const [isThinking, setIsThinking] = useState(false)
  const [tokens, setTokens] = useState([])
  const [response, setResponse] = useState('')
  const [message, setMessage] = useState('')
  const [viewMode, setViewMode] = useState('split')  // 'split' or 'graph'
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(false)
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(false)
  const visualBrainRef = useRef(null)

  // Zustand store
  const {
    workspaces,
    currentWorkspaceId,
    conversations,
    currentConversationId,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    setCurrentWorkspace,
    createConversation,
    setCurrentConversation,
    deleteConversation,
  } = useStore()

  const handleSendMessage = async (messageText) => {
    setMessage(messageText)
    try {
      setIsThinking(true)
      setResponse('')
      setTokens([])

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
      setConversationSidebarOpen(false)
    }
  }

  const handleSelectConversation = async (conversationId) => {
    setCurrentConversation(conversationId)
    setMessage('')
    setResponse('')
    setTokens([])
    setConversationSidebarOpen(false)
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

  // Get current workspace for header display
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

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

  // Keyboard shortcuts: G (graph), S (split), Escape (close sidebars)
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
      if (key === 'g') {
        setViewMode('graph')
      } else if (key === 's') {
        setViewMode('split')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Show loading screen during initialization
  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Chargement de vos données...</p>
      </div>
    )
  }

  return (
    <div className="main-layout" data-view-mode={viewMode}>
      {/* Workspace Sidebar (toggle with overlay) */}
      {workspaceSidebarOpen && (
        <>
          <div
            className="sidebar-overlay"
            onClick={() => setWorkspaceSidebarOpen(false)}
          />
          <div className="workspace-sidebar-container open">
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

      {/* New SOTA Sidebar Component */}
      <Sidebar
        conversations={conversations}
        activeConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={conversationSidebarOpen}
        onToggle={() => setConversationSidebarOpen(!conversationSidebarOpen)}
      />

      {/* Main content area */}
      <div className="main-content-area">
        {/* Header with Toggle Buttons and View Mode Controls */}
        <header className="main-header">
          {/* Left: Logo with text */}
          <div className="header-left">
            <ZyronLogo size="sm" className="header-logo-with-text" />
          </div>

          {/* Center: Workspace info + View mode controls */}
          <div className="header-center">
            {currentWorkspace && (
              <div className="workspace-info">
                <div
                  className="workspace-dot"
                  style={{ background: currentWorkspace.color }}
                />
                <span className="workspace-name">{currentWorkspace.name}</span>
              </div>
            )}

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
                Split
              </button>
            </div>
          </div>

          {/* Right: Quick access to workspaces/conversations + User button */}
          <div className="header-right">
            {/* Quick badges for workspace/conversations */}
            <div className="quick-badges">
              <div className="toggle-wrapper">
                <button
                  className="quick-badge-btn"
                  onClick={() => setWorkspaceSidebarOpen(true)}
                  title="Workspaces"
                  aria-label="Ouvrir les workspaces"
                />
                {workspaces.length > 0 && (
                  <span className="badge">{workspaces.length}</span>
                )}
              </div>

              <div className="toggle-wrapper">
                <button
                  className="quick-badge-btn"
                  onClick={() => setConversationSidebarOpen(true)}
                  title="Conversations"
                  aria-label="Ouvrir les conversations"
                />
                {conversations.length > 0 && (
                  <span className="badge">{conversations.length}</span>
                )}
              </div>
            </div>

            {/* User button */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Content container - Chat LEFT, Graph RIGHT */}
        <div className="content-wrapper">
          {/* Chat Panel - LEFT side (28%) - Shows in Split mode only */}
          {viewMode === 'split' && (
            <div className="chat-section">
              <ChatPanelContent
                message={message}
                response={response}
                isThinking={isThinking}
                onSendMessage={handleSendMessage}
              />
            </div>
          )}

          {/* Visual Brain - RIGHT side (72%) - Always visible, lazy-loaded */}
          <div className="visual-brain-section">
            <Suspense fallback={<div className="h-full w-full bg-[#F7F7F7]" />}>
              <VisualBrain
                ref={visualBrainRef}
                isThinking={isThinking}
                tokens={tokens}
                onNodeClick={(node) => console.log('Node clicked:', node)}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
