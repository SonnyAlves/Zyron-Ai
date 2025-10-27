import React, { useState } from 'react';
import { SignIn } from '@clerk/clerk-react';
import GuestApp from './GuestApp';
import './LandingPage.css';

const LandingPage = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [startedGuest, setStartedGuest] = useState(false);

  if (startedGuest) {
    return <GuestApp />;
  }

  if (showSignIn) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <button
            className="back-button"
            onClick={() => setShowSignIn(false)}
          >
            ← Back
          </button>
          <div className="auth-content">
            <div className="auth-left">
              <img src="/zyron-logo-mobile.png" alt="Zyron AI" className="auth-logo" />
              <h1>Bienvenue sur Zyron AI</h1>
              <p>Resolving mind's chaos</p>
            </div>
            <div className="auth-right">
              <SignIn routing="hash" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="landing-hero">
        <img src="/zyron-logo-mobile.png" alt="Zyron AI" className="landing-logo" />
        <h1 className="landing-title">
          Zyron AI
        </h1>
        <p className="landing-subtitle">
          Resolving mind's chaos
        </p>
        <p className="landing-description">
          Un assistant IA qui visualise votre pensée en temps réel.<br/>
          Transformez vos conversations en graphe de connaissances interactif.
        </p>

        {/* CTA Buttons */}
        <div className="landing-cta">
          <button
            className="cta-button primary"
            onClick={() => setStartedGuest(true)}
          >
            Try Now - Free
          </button>
          <button
            className="cta-button secondary"
            onClick={() => setShowSignIn(true)}
          >
            Sign In
          </button>
        </div>

        <p className="landing-note">
          ✨ 10 messages gratuits, aucune inscription requise
        </p>
      </div>

      {/* Features Preview */}
      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>Chat Intelligent</h3>
          <p>Conversations naturelles avec Claude Sonnet 4</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>Visual Brain</h3>
          <p>Graphe 3D de vos concepts en temps réel</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🚀</div>
          <h3>Workspaces</h3>
          <p>Organisez vos projets et idées</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
