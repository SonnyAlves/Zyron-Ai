import React, { useEffect } from 'react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useGuestStore } from '../store/useGuestStore';
import LandingPage from './LandingPage';
import './AuthWrapper.css';

const AuthWrapper = ({ children }) => {
  const { isLoaded } = useSupabaseAuth();
  const { enableGuestMode } = useGuestStore();

  useEffect(() => {
    // Activer automatiquement le mode guest si pas connecté
    enableGuestMode();
  }, [enableGuestMode]);

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
        {/* Landing page avec accès guest */}
        <LandingPage />
      </SignedOut>

      <SignedIn>
        {children}
      </SignedIn>
    </>
  );
};

export default AuthWrapper;
