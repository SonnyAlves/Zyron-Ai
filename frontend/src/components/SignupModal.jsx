import { SignUp } from '@clerk/clerk-react'

/**
 * Signup modal that appears when guests reach their message limit
 * Shows Clerk SignUp form with a motivating message
 */
export default function SignupModal({ onClose, messagesUsed }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close if clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-8 relative shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white text-2xl font-light transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You've used {messagesUsed}/10 free messages!
          </h2>
          <p className="text-white/70 text-base">
            Sign up to get <strong className="text-white">unlimited messages</strong> and save your conversations
          </p>
        </div>

        {/* Benefits list */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center text-green-400 text-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Unlimited messages
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Save and organize conversations
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Access from any device
          </div>
          <div className="flex items-center text-green-400 text-sm">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Visual Brain graph history
          </div>
        </div>

        {/* Clerk SignUp component */}
        <div className="clerk-signup-container">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-gray-900 shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white hover:bg-gray-100',
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                footerActionLink: 'text-blue-400 hover:text-blue-300'
              }
            }}
            routing="hash"
            signInUrl="/sign-in"
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-white/50 text-xs mt-4">
          100% free • No credit card required • Takes 30 seconds
        </p>
      </div>
    </div>
  )
}
