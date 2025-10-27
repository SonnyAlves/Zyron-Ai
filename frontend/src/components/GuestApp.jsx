import React, { useState, useRef, useCallback, Suspense, lazy } from 'react';
import { useGuestStore } from '../store/useGuestStore';
import { SignIn, useClerk } from '@clerk/clerk-react';
import { useStreamingChat } from '../hooks/useStreamingChat';
const VisualBrain = lazy(() => import('./VisualBrain'));
import './GuestApp.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const GuestApp = () => {
  const [viewMode, setViewMode] = useState('split');
  const [tokens, setTokens] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const visualBrainRef = useRef(null);

  const {
    guestMessages,
    addGuestMessage,
    isLimitReached,
    getRemainingMessages,
  } = useGuestStore();

  const { openSignUp } = useClerk();
  const { isLoading, error, sendMessage, abort } = useStreamingChat(API_URL);

  const remaining = getRemainingMessages();
  const showBanner = remaining <= 3;

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    if (isLimitReached()) {
      openSignUp();
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setTokens([]);

    // Add user message to store
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    addGuestMessage(userMsg);

    // Stream response from backend
    await sendMessage(
      userMessage,
      // onChunk: track tokens for visual brain
      (token) => {
        setTokens((prev) => [...prev, token]);
        visualBrainRef.current?.addToken(token);
      },
      // onComplete: add assistant message to store
      (fullContent) => {
        const assistantMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullContent,
          created_at: new Date().toISOString(),
        };
        addGuestMessage(assistantMsg);
      },
      // onError: handle errors (error state is already in hook)
      (err) => {
        console.error('Streaming error:', err);
      }
    );
  }, [inputValue, isLoading, isLimitReached, sendMessage, addGuestMessage, openSignUp]);

  return (
    <div className="guest-app">
      {/* Header */}
      <div className="guest-header">
        <div className="header-left">
          <img src="/logos/zyron-logo.png" alt="Zyron AI" className="header-logo" />
          <span className="header-title">Zyron AI</span>
          <span className="guest-badge">Guest Mode</span>
        </div>

        <div className="header-right">
          {/* View mode toggles */}
          <div className="view-mode-toggles">
            <button
              className={`view-mode-button ${viewMode === 'graph' ? 'active' : ''}`}
              onClick={() => setViewMode('graph')}
            >
              Graph
            </button>
            <button
              className={`view-mode-button ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              Split
            </button>
          </div>

          {/* Sign up button */}
          <button
            className="signup-button"
            onClick={() => openSignUp()}
          >
            Sign Up - Free
          </button>
        </div>
      </div>

      {/* Banner limite messages */}
      {showBanner && !isLimitReached() && (
        <div className="limit-banner warning">
          ⚠️ {remaining} messages restants. <button onClick={() => openSignUp()}>S'inscrire gratuitement</button> pour continuer.
        </div>
      )}

      {/* Banner limite atteinte */}
      {isLimitReached() && (
        <div className="limit-banner error">
          🚀 Limite atteinte ! <button onClick={() => openSignUp()}>Créez un compte gratuit</button> pour continuer à utiliser Zyron AI.
        </div>
      )}

      {/* Main content */}
      <div className="guest-content">
        {/* Chat Panel - LEFT side (28%) */}
        {viewMode === 'split' && (
          <div className="chat-section">
            <div className="chat-panel-guest">
              {/* Messages area */}
              <div className="messages-area">
                {guestMessages.length === 0 ? (
                  <div className="empty-state">
                    <h2>Bienvenue sur Zyron AI</h2>
                    <p>Posez-moi n'importe quelle question</p>
                    <p className="guest-info">
                      ✨ 10 messages gratuits pour tester
                    </p>
                    <div className="suggested-prompts">
                      <button onClick={() => setInputValue("Explique-moi l'IA")}>
                        Explique-moi l'IA
                      </button>
                      <button onClick={() => setInputValue("Aide-moi à coder")}>
                        Aide-moi à coder
                      </button>
                      <button onClick={() => setInputValue("Inspire-moi")}>
                        Inspire-moi
                      </button>
                    </div>
                  </div>
                ) : (
                  guestMessages.map((msg, index) => (
                    <div key={msg.id || index} className={`message ${msg.role}`}>
                      <div className="message-content">
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {error && (
                  <div className="message error">
                    <div className="message-content">
                      <strong>Error:</strong> {error}
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div className="message assistant">
                    <div className="message-content">
                      <div className="thinking-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="input-area">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isLimitReached() ? "Inscrivez-vous pour continuer..." : "Message Zyron AI..."}
                  disabled={isLimitReached() || isLoading}
                />
                {isLoading ? (
                  <button
                    onClick={abort}
                    className="send-button stop-button"
                    title="Stop generating"
                  >
                    ⏹
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading || isLimitReached()}
                    className="send-button"
                  >
                    ↑
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visual Brain - RIGHT side (72%) - lazy-loaded */}
        <div className="visual-brain-section">
          <Suspense fallback={<div className="h-full w-full bg-[#F7F7F7]" />}>
            <VisualBrain
              ref={visualBrainRef}
              isThinking={isLoading}
              tokens={tokens}
              onNodeClick={(node) => console.log('Node clicked:', node)}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default GuestApp;
