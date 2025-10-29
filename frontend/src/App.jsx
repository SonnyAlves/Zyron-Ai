import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import LandingPage from './components/LandingPage'
import MainLayout from './components/MainLayout'
import GuestChatLayout from './components/GuestChatLayout'
import SignupModal from './components/SignupModal'

/**
 * Single unified App that works for both guests and authenticated users
 *
 * Flow:
 * 1. Landing page (if not signed in and hasn't started)
 * 2. Guest chat (10 free messages)
 * 3. Signup modal after 10 messages
 * 4. Authenticated mode (unlimited)
 */
export default function App() {
  const { isSignedIn, user } = useUser()
  const [showLanding, setShowLanding] = useState(true)
  const [messageCount, setMessageCount] = useState(() => {
    // Load from localStorage for guests
    return parseInt(localStorage.getItem('guestMessageCount') || '0')
  })
  const [showSignupPopup, setShowSignupPopup] = useState(false)

  // Save message count for guests
  useEffect(() => {
    if (!isSignedIn) {
      localStorage.setItem('guestMessageCount', messageCount.toString())
    }
  }, [messageCount, isSignedIn])

  // Reset count when user signs in
  useEffect(() => {
    if (isSignedIn) {
      localStorage.removeItem('guestMessageCount')
      setMessageCount(0)
    }
  }, [isSignedIn])

  /**
   * Check if guest can send message (before sending)
   * Returns true if message can be sent, false if blocked
   */
  const handleBeforeSend = () => {
    // Check limit for guests
    if (!isSignedIn && messageCount >= 10) {
      setShowSignupPopup(true)
      return false // Block message
    }

    // Increment counter for guests
    if (!isSignedIn) {
      setMessageCount(prev => prev + 1)
    }

    return true // Allow message
  }

  const remainingMessages = isSignedIn ? null : Math.max(0, 10 - messageCount)

  // If user is signed in → Show full app with sidebar
  if (isSignedIn) {
    return <MainLayout />
  }

  // If not signed in and landing page visible → Show landing page
  if (!isSignedIn && showLanding) {
    return (
      <LandingPage
        onGetStarted={() => setShowLanding(false)}
      />
    )
  }

  // Guest mode → Simple chat with message limit
  return (
    <>
      <GuestChatLayout
        onBeforeSend={handleBeforeSend}
        remainingMessages={remainingMessages}
        onSignupClick={() => setShowSignupPopup(true)}
      />

      {/* Signup modal for guests */}
      {showSignupPopup && (
        <SignupModal
          onClose={() => setShowSignupPopup(false)}
          messagesUsed={messageCount}
        />
      )}
    </>
  )
}
