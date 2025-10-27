import React, { useState } from 'react';
import { SignIn } from '@clerk/clerk-react';
import GuestApp from './GuestApp';
import AnimatedBackground from './AnimatedBackground';
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
      <AnimatedBackground />

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
          10 messages gratuits, aucune inscription requise
        </p>
      </div>

      {/* Features Preview */}
      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Chat Intelligent</h3>
          <p>Conversations naturelles avec l'intelligence artificielle</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
              <circle cx="6" cy="6" r="2" stroke="white" strokeWidth="2"/>
              <circle cx="18" cy="6" r="2" stroke="white" strokeWidth="2"/>
              <circle cx="6" cy="18" r="2" stroke="white" strokeWidth="2"/>
              <circle cx="18" cy="18" r="2" stroke="white" strokeWidth="2"/>
              <line x1="7.5" y1="7.5" x2="10" y2="10" stroke="white" strokeWidth="2"/>
              <line x1="16.5" y1="7.5" x2="14" y2="10" stroke="white" strokeWidth="2"/>
              <line x1="7.5" y1="16.5" x2="10" y2="14" stroke="white" strokeWidth="2"/>
              <line x1="16.5" y1="16.5" x2="14" y2="14" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h3>Visual Brain</h3>
          <p>Graphe 3D de vos concepts en temps réel</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="22.08" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Workspaces</h3>
          <p>Organisez vos projets et idées</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
