import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, X } from 'lucide-react';
import './sidebar.css';

export default function SearchBar({
  conversations = [],
  onSelect,
  isOpen,
  onOpenChange
}) {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!searchValue.trim()) {
      setResults([]);
      return;
    }

    const query = searchValue.toLowerCase();
    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(query)
    );
    setResults(filtered);
  }, [searchValue, conversations]);

  const handleSelect = (conversation) => {
    onSelect?.(conversation);
    setSearchValue('');
    onOpenChange?.(false);
  };

  // Keyboard handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onOpenChange?.(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  return (
    <>
      <button
        className="sidebar-search-trigger"
        onClick={() => onOpenChange?.(true)}
      >
        <Search size={18} />
        <span>Search chats...</span>
        <kbd>⌘K</kbd>
      </button>

      {isOpen && (
        <div className="sidebar-search-overlay">
          <div className="sidebar-search-dialog">
            <div className="sidebar-search-input-wrapper">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
                className="sidebar-search-input"
              />
              <button
                onClick={() => onOpenChange?.(false)}
                className="sidebar-search-close"
              >
                <X size={18} />
              </button>
            </div>

            {results.length > 0 ? (
              <div className="sidebar-search-results">
                {results.map(conv => (
                  <button
                    key={conv.id}
                    className="sidebar-search-result-item"
                    onClick={() => handleSelect(conv)}
                  >
                    <span className="sidebar-search-result-title">{conv.title}</span>
                    <span className="sidebar-search-result-preview">
                      {conv.message_count || 0} messages
                    </span>
                  </button>
                ))}
              </div>
            ) : searchValue.trim() ? (
              <div className="sidebar-search-empty">
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="sidebar-search-empty">
                <p>Type to search...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
