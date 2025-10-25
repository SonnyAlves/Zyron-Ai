import React, { useState } from 'react';
import MarkdownMessage from './MarkdownMessage';
import './MessageWithCopy.css';

const MessageWithCopy = ({ message }) => {
  const [copied, setCopied] = useState(false);

  // Support both formats: Supabase (role/content) and localStorage (type/text)
  const messageRole = message.role || message.type
  const messageContent = message.content || message.text

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`message-wrapper ${messageRole}`}>
      <div className={`message ${messageRole}`}>
        {messageRole === 'assistant' ? (
          <MarkdownMessage content={messageContent} />
        ) : (
          messageContent
        )}
      </div>

      {messageRole === 'assistant' && (
        <button
          className={`copy-message-button ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy message"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="copy-text">Copied!</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect
                  x="9"
                  y="9"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="copy-text">Copy</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default MessageWithCopy;
