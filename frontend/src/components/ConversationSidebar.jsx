import React, { useMemo, useState } from 'react'
import { formatDate } from '../utils/formatDate'
import './ConversationSidebar.css'

/**
 * Group conversations by date (Today, Yesterday, This week, Older)
 */
const groupConversationsByDate = (conversations) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  }

  conversations.forEach(conv => {
    const convDate = new Date(conv.updated_at)
    const convDateOnly = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate())

    if (convDateOnly >= today) {
      groups.today.push(conv)
    } else if (convDateOnly >= yesterday) {
      groups.yesterday.push(conv)
    } else if (convDateOnly >= lastWeek) {
      groups.thisWeek.push(conv)
    } else {
      groups.older.push(conv)
    }
  })

  return groups
}

const ConversationSidebar = ({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [conversations, searchQuery])

  // Group filtered conversations by date
  const groupedConversations = useMemo(() =>
    groupConversationsByDate(filteredConversations),
    [filteredConversations]
  )

  // Render conversation group
  const renderGroup = (groupTitle, convs) => {
    if (convs.length === 0) return null

    return (
      <div className="conversation-group" key={groupTitle}>
        <div className="group-title">{groupTitle}</div>
        {convs.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''} ${
              deletingId === conv.id ? 'deleting' : ''
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="conversation-info">
              <div className="conversation-title">{conv.title}</div>
              <div className="conversation-timestamp">
                {formatDate(conv.updated_at, 'fr-FR')}
              </div>
            </div>
            <button
              className="delete-conversation-button"
              onClick={(e) => {
                e.stopPropagation()
                setDeletingId(conv.id)
                setTimeout(() => {
                  onDeleteConversation(conv.id)
                  setDeletingId(null)
                }, 200)
              }}
              aria-label="Supprimer"
              title="Supprimer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6h14Z"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className="conversation-sidebar">
        {/* Header with close button */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">Conversations</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="sidebar-actions">
          <button className="new-chat-button" onClick={onNewChat}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nouvelle conversation
          </button>
        </div>

        {/* Search Bar */}
        {conversations.length > 0 && (
          <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher une conversation"
            />
          </div>
        )}

        {/* Conversations List */}
        <div className="conversations-list">
          {filteredConversations.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"/>
              </svg>
              <p>{searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}</p>
              {!searchQuery && (
                <button className="start-chat-button" onClick={onNewChat}>
                  Commencer une conversation
                </button>
              )}
            </div>
          ) : (
            <>
              {renderGroup("Aujourd'hui", groupedConversations.today)}
              {renderGroup("Hier", groupedConversations.yesterday)}
              {renderGroup("Cette semaine", groupedConversations.thisWeek)}
              {renderGroup("Plus ancien", groupedConversations.older)}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ConversationSidebar
