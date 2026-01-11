import { useState } from 'react'
import axios from 'axios'
import './GoogleAccountSelection.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface GoogleAccount {
  id: string
  name: string
  email: string
  picture: string
  status?: 'connected' | 'disconnected'
}

interface GoogleAccountSelectionProps {
  onAccountSelected: (user: any, token: string) => void
  onBack: () => void
}

// Demo accounts - In production, these would come from Google OAuth API
const DEMO_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  {
    id: '1',
    name: 'Gilles Ceyssat',
    email: 'gilles.ceyssat@gmail.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gilles',
    status: 'connected'
  },
  {
    id: '2',
    name: 'gilles stark',
    email: 'peter.stark92@gmail.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stark',
    status: 'disconnected'
  },
  {
    id: '3',
    name: 'Gilles DILLIGAF',
    email: 'gilles.dilligaf@gmail.com',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DILLIGAF',
    status: 'connected'
  }
]

export default function GoogleAccountSelection({ onAccountSelected, onBack }: GoogleAccountSelectionProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAccountSelect = async (account: GoogleAccount) => {
    setLoading(account.id)

    try {
      // Demo mode: Create a demo user with Google OAuth
      // In production, replace this with actual Google Sign-In SDK
      const demoGoogleUser = {
        sub: `google_${account.id}_${Date.now()}`,
        email: account.email,
        name: account.name,
      }

      const response = await axios.post(`${API_URL}/auth/google`, {
        providerId: demoGoogleUser.sub,
        email: demoGoogleUser.email,
        name: demoGoogleUser.name,
      })
      const { user, token } = response.data.data
      onAccountSelected(user, token)
    } catch (err: any) {
      console.error('Error signing in with Google:', err)
      // In production, show error message
    } finally {
      setLoading(null)
    }
  }

  const handleUseAnotherAccount = () => {
    // In production, this would open Google's OAuth flow
    console.log('Use another account clicked')
    // For demo, create a new account
    handleAccountSelect({
      id: 'new',
      name: 'New Account',
      email: 'new.account@gmail.com',
      picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=New'
    })
  }

  return (
    <div className="google-account-selection">
      <div className="google-selection-card">
        {/* Header */}
        <div className="google-selection-header">
          <div className="google-logo-section">
            <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="google-header-text">Sign in with Google</span>
          </div>
          <button 
            className="google-back-button" 
            onClick={onBack}
            type="button"
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="google-selection-content">
          {/* Left Panel - App Info */}
          <div className="google-selection-left">
            <div className="app-logo-square">
              <span className="app-logo-letter">B</span>
            </div>
            <h2 className="selection-title">Select an account</h2>
            <p className="selection-subtitle">
              Access the <span className="app-name-link">Warchain Arena</span> application
            </p>
          </div>

          {/* Right Panel - Account List */}
          <div className="google-selection-right">
            <div className="accounts-list">
              {DEMO_GOOGLE_ACCOUNTS.map((account) => (
                <div
                  key={account.id}
                  className={`account-item ${loading === account.id ? 'loading' : ''}`}
                  onClick={() => handleAccountSelect(account)}
                >
                  <img src={account.picture} alt={account.name} className="account-avatar" />
                  <div className="account-info">
                    <div className="account-name">{account.name}</div>
                    <div className="account-email">{account.email}</div>
                  </div>
                  {account.status === 'disconnected' && (
                    <span className="account-status">Disconnected</span>
                  )}
                </div>
              ))}

              <div
                className="account-item use-another"
                onClick={handleUseAnotherAccount}
              >
                <div className="account-avatar add-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="account-info">
                  <div className="account-name">Use another account</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="google-selection-footer">
          <p className="legal-text">
            Before using the Warchain Arena app, you can consult its{' '}
            <a href="#" className="legal-link">Privacy Policy</a> and{' '}
            <a href="#" className="legal-link">Terms of Use</a>.
          </p>
        </div>
      </div>

      {/* Page Footer */}
      <div className="page-footer">
        <div className="footer-left">
          <select className="language-select">
            <option>English (United States)</option>
            <option>Français (France)</option>
          </select>
        </div>
        <div className="footer-right">
          <a href="#" className="footer-link">Help</a>
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
        </div>
      </div>
    </div>
  )
}
