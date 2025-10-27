import React, { useState, useRef } from 'react';
import { useGuestStore } from '../store/useGuestStore';
import { SignIn, useClerk } from '@clerk/clerk-react';
import VisualBrain from './VisualBrain';
import './GuestApp.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const GuestApp = () => {
  const [viewMode, setViewMode] = useState('split');
  const [isThinking, setIsThinking] = useState(false);
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

  const remaining = getRemainingMessages();
  const showBanner = remaining <= 3;

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    if (isLimitReached()) {
      openSignUp();
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsThinking(true);
    setTokens([]);

    try {
      // Add user message
      const userMsg = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      addGuestMessage(userMsg);

      // Call backend
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('data: ')) {
            const text = line.slice(6);
            if (text) {
              assistantContent += text;
              setTokens((prev) => [...prev, text]);
            }
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        const text = buffer.slice(6);
        if (text) {
          assistantContent += text;
          setTokens((prev) => [...prev, text]);
        }
      }

      // Add assistant message
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      };
      addGuestMessage(assistantMsg);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="guest-app">
      {/* Header */}
      <div className="guest-header">
        <div className="header-left">
          <img src="/logos/zyron-icon-new.svg" alt="Zyron AI" className="header-logo" />
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
                {isThinking && (
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
                  disabled={isLimitReached() || isThinking}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isThinking || isLimitReached()}
                  className="send-button"
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visual Brain - RIGHT side (72%) */}
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
  );
};

export default GuestApp;
