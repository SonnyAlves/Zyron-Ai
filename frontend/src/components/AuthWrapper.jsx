import React from 'react';
import { SignIn, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import './AuthWrapper.css';

const AuthWrapper = ({ children }) => {
  const { isLoaded } = useSupabaseAuth();

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading Zyron AI...</p>
      </div>
    );
  }

  return (
    <>
      <SignedOut>
        <div className="auth-container">
          <div className="auth-card">
            <img src="/zyron-logo-mobile.png" alt="Zyron AI" className="auth-logo" />
            <h1>Bienvenue sur Zyron AI</h1>
            <p>Resolving mind's chaos</p>
            <SignIn routing="hash" />
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="app-header-user">
          <UserButton afterSignOutUrl="/" />
        </div>
        {children}
      </SignedIn>
    </>
  );
};

export default AuthWrapper;
