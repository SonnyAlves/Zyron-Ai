import { useState, useEffect, useRef } from 'react'
import { UserButton } from '@clerk/clerk-react'
import VisualBrain from './VisualBrain'
import ChatPanelContent from './ChatPanelContent'
import ZyronLogo from './ZyronLogo'
import WorkspaceSidebar from './WorkspaceSidebar'
import ConversationSidebar from './ConversationSidebar'
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

      {/* Conversation Sidebar (toggle with overlay) */}
      {conversationSidebarOpen && (
        <>
          <div
            className="sidebar-overlay"
            onClick={() => setConversationSidebarOpen(false)}
          />
          <div className="conversation-sidebar-container open">
            <ConversationSidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              isOpen={conversationSidebarOpen}
              onClose={() => setConversationSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <div className="main-content-area">
        {/* Header with Toggle Buttons and View Mode Controls */}
        <header className="main-header">
          <div className="header-left">
            {/* Zyron Logo - Icon only, small size, on the left */}
            <ZyronLogo size="sm" className="header-logo" />

            {/* Toggle Workspaces Button - avec icône flaticon + tooltip + badge */}
            <div className="toggle-wrapper">
              <button
                className="toggle-button"
                onClick={() => setWorkspaceSidebarOpen(true)}
                title="Workspaces"
                aria-label="Ouvrir les workspaces"
              >
                {/* Flaticon grid icon for workspaces */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="4" width="6" height="6" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="4" width="6" height="6" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="4" y="14" width="6" height="6" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="14" y="14" width="6" height="6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {workspaces.length > 0 && (
                  <span className="toggle-badge">{workspaces.length}</span>
                )}
              </button>
              <div className="toggle-tooltip">Workspaces ({workspaces.length})</div>
            </div>

            {/* Toggle Conversations Button - avec icône flaticon + tooltip + badge */}
            <div className="toggle-wrapper">
              <button
                className="toggle-button"
                onClick={() => setConversationSidebarOpen(true)}
                title="Conversations"
                aria-label="Ouvrir les conversations"
              >
                {/* Flaticon chat/message icon for conversations */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {conversations.length > 0 && (
                  <span className="toggle-badge">{conversations.length}</span>
                )}
              </button>
              <div className="toggle-tooltip">Conversations ({conversations.length})</div>
            </div>

            {/* Current workspace badge */}
            {currentWorkspace && (
              <div className="current-workspace-badge">
                <div
                  className="workspace-color-dot-header"
                  style={{ background: currentWorkspace.color }}
                />
                <span className="workspace-name-header">{currentWorkspace.name}</span>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Right section: View Mode toggles + UserButton */}
          <div className="header-right">
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

          {/* Visual Brain - RIGHT side (72%) - Always visible */}
          <div className="visual-brain-section">
            <VisualBrain
              ref={visualBrainRef}
              isThinking={isThinking}
              tokens={tokens}
              onNodeClick={(node) => console.log('Node clicked:', node)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
