/**
 * useAuth Hook
 * Manages authentication state and operations
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import {
  supabase,
  isSupabaseConfigured,
  getCurrentUser,
  getCurrentSession,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  onAuthStateChange
} from '../lib/supabase'

// Auth Context
const AuthContext = createContext(null)

/**
 * Auth Provider Component
 * Wrap your app with this to provide auth state to all components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize auth state
  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.log('🔓 Running in guest mode - Supabase not configured')
      setLoading(false)
      return
    }

    // Get initial session
    getCurrentSession().then((session) => {
      setSession(session)
      setUser(session?.user || null)
      setIsAuthenticated(!!session)
      setLoading(false)
    })

    // Listen to auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event)
      setSession(session)
      setUser(session?.user || null)
      setIsAuthenticated(!!session)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Sign up
  const signUp = useCallback(async (email, password, displayName = null) => {
    try {
      const { user, session } = await supabaseSignUp(email, password, displayName)
      setUser(user)
      setSession(session)
      setIsAuthenticated(!!session)
      return { user, session }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }, [])

  // Sign in
  const signIn = useCallback(async (email, password) => {
    try {
      const { user, session } = await supabaseSignIn(email, password)
      setUser(user)
      setSession(session)
      setIsAuthenticated(!!session)
      return { user, session }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await supabaseSignOut()
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [])

  // Get access token for API calls
  const getAccessToken = useCallback(() => {
    return session?.access_token || null
  }, [session])

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    getAccessToken,
    isSupabaseConfigured: isSupabaseConfigured()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 * Access auth state and methods from any component
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Simple hook for components that just need auth state
 */
export function useAuthState() {
  const { user, isAuthenticated, loading } = useAuth()
  return { user, isAuthenticated, loading }
}
