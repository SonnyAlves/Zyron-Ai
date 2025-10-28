import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { groupConversations } from '../../utils/groupConversations';
import ConversationItem from './ConversationItem';
import SectionHeader from './SectionHeader';
import SearchBar from './SearchBar';
import './sidebar.css';

export default function Sidebar({
  conversations = [],
  activeConversationId = null,
  onSelectConversation = () => {},
  onNewConversation = () => {},
  onRenameConversation = () => {},
  onDeleteConversation = () => {},
  isOpen = true,
  onToggle = () => {}
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [allOlderVisible, setAllOlderVisible] = useState(false);

  // Group conversations
  const grouped = useMemo(() => groupConversations(conversations), [conversations]);

  // Limit older conversations initially
  const displayedOlder = useMemo(() => {
    if (allOlderVisible) return grouped.older;
    return grouped.older.slice(0, 5);
  }, [grouped.older, allOlderVisible]);

  const hasMoreOlder = grouped.older.length > 5;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K: Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Cmd/Ctrl + N: New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onNewConversation();
      }
      // Escape: Close search
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewConversation]);

  const handleConversationSelect = useCallback((conversation) => {
    onSelectConversation(conversation);
    setSearchOpen(false);
  }, [onSelectConversation]);

  const handleRename = useCallback((convId) => {
    onRenameConversation(convId);
  }, [onRenameConversation]);

  const handleDelete = useCallback((convId) => {
    onDeleteConversation(convId);
  }, [onDeleteConversation]);

  const isEmpty = conversations.length === 0;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => onToggle?.()}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        {/* Header with Close Button */}
        <div className="sidebar-header">
          <button
            className="sidebar-close-btn"
            onClick={() => onToggle?.()}
            aria-label="Close sidebar"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <SearchBar
          conversations={conversations}
          onSelect={handleConversationSelect}
          isOpen={searchOpen}
          onOpenChange={setSearchOpen}
        />

        {/* New Conversation CTA */}
        <button className="sidebar-new-chat-btn" onClick={onNewConversation}>
          <Plus size={18} />
          <span>New conversation</span>
        </button>

        {/* Conversations List */}
        {isEmpty ? (
          <div className="sidebar-empty-state">
            <p>No conversations yet</p>
            <p className="sidebar-empty-subtext">
              Start a new conversation to get going
            </p>
          </div>
        ) : (
          <div className="sidebar-conversations">
            {/* Today */}
            {grouped.today.length > 0 && (
              <section className="sidebar-section">
                <SectionHeader>Today</SectionHeader>
                {grouped.today.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    isActive={conv.id === activeConversationId}
                    onClick={() => handleConversationSelect(conv)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </section>
            )}

            {/* Yesterday */}
            {grouped.yesterday.length > 0 && (
              <section className="sidebar-section">
                <SectionHeader>Yesterday</SectionHeader>
                {grouped.yesterday.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    isActive={conv.id === activeConversationId}
                    onClick={() => handleConversationSelect(conv)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </section>
            )}

            {/* Last 7 days */}
            {grouped.lastWeek.length > 0 && (
              <section className="sidebar-section">
                <SectionHeader>Last 7 days</SectionHeader>
                {grouped.lastWeek.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    isActive={conv.id === activeConversationId}
                    onClick={() => handleConversationSelect(conv)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </section>
            )}

            {/* Older */}
            {grouped.older.length > 0 && (
              <section className="sidebar-section">
                <div className="sidebar-section-header-with-action">
                  <SectionHeader>Older</SectionHeader>
                  {hasMoreOlder && !allOlderVisible && (
                    <button
                      className="sidebar-load-more-btn"
                      onClick={() => setAllOlderVisible(true)}
                    >
                      ↓
                    </button>
                  )}
                </div>
                {displayedOlder.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    id={conv.id}
                    title={conv.title}
                    isActive={conv.id === activeConversationId}
                    onClick={() => handleConversationSelect(conv)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))}
              </section>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
