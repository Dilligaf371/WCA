import { useState, useEffect } from 'react'
import axios from 'axios'
import './LoginPage.css'
import GoogleAccountSelection from './GoogleAccountSelection'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID || ''
const APPLE_REDIRECT_URI = import.meta.env.VITE_APPLE_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')

interface LoginPageProps {
  onLogin: (user: any, token: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showGoogleSelection, setShowGoogleSelection] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  const videos = ['/wca-login-video.mp4', '/wca-login-video2.mp4']

  // Preload videos for smooth transitions
  useEffect(() => {
    videos.forEach((videoSrc) => {
      const video = document.createElement('video')
      video.src = videoSrc
      video.preload = 'auto'
    })
  }, [videos])

  // Alternate between videos every 12 seconds (loop duration)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length)
    }, 12000)

    return () => clearInterval(timer)
  }, [videos.length])

  // Demo mode: Simple OAuth simulation for development
  const handleGoogleLogin = () => {
    setShowGoogleSelection(true)
  }

  const handleGoogleAccountSelected = (user: any, token: string) => {
    onLogin(user, token)
  }

  // Initialize Apple Sign In SDK (only if client ID is configured)
  useEffect(() => {
    if (APPLE_CLIENT_ID && typeof window !== 'undefined' && (window as any).AppleID) {
      const AppleID = (window as any).AppleID
      try {
        AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: APPLE_REDIRECT_URI,
          state: 'origin:web',
          usePopup: true,
        })
      } catch (err) {
        console.error('Apple Sign In initialization error:', err)
      }
    }
  }, [])

  const handleAppleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if Apple Client ID is configured
      if (!APPLE_CLIENT_ID) {
        throw new Error('Apple Sign In is not configured. Please set VITE_APPLE_CLIENT_ID in your environment variables. See APPLE_SIGNIN_SETUP.md for setup instructions.')
      }

      // Check if Apple SDK is available
      if (typeof window === 'undefined' || !(window as any).AppleID) {
        throw new Error('Apple Sign In SDK not loaded. Please check your configuration.')
      }

      const AppleID = (window as any).AppleID

      // Sign in with Apple
      const response = await AppleID.auth.signIn()
      
      // Response contains: authorization, user (user is only present on first sign-in)
      const { authorization, user } = response

      // Decode identity token to get user ID (sub)
      let providerId = `apple_${Date.now()}`
      let email = ''
      let name = undefined

      try {
        // Decode JWT (base64url decode)
        const idTokenParts = authorization.id_token.split('.')
        if (idTokenParts.length === 3) {
          const payload = JSON.parse(atob(idTokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
          providerId = payload.sub || providerId
          email = payload.email || email
        }
      } catch (e) {
        console.warn('Could not decode Apple identity token:', e)
      }

      // Use user object if provided (first sign-in only)
      if (user) {
        email = user.email || email
        if (user.name) {
          const firstName = user.name.firstName || ''
          const lastName = user.name.lastName || ''
          name = `${firstName} ${lastName}`.trim() || undefined
        }
      }

      if (!email) {
        throw new Error('Email is required for Apple Sign In. Please try again or contact support.')
      }

      const appleUser = {
        providerId,
        email,
        name,
        authorizationCode: authorization.code,
        identityToken: authorization.id_token,
        state: authorization.state,
      }

      // Send to backend for verification and user creation/login
      const backendResponse = await axios.post(`${API_URL}/auth/apple`, {
        providerId: appleUser.providerId,
        email: appleUser.email,
        name: appleUser.name,
        authorizationCode: appleUser.authorizationCode,
        identityToken: appleUser.identityToken,
      })

      const { user: backendUser, token } = backendResponse.data.data
      onLogin(backendUser, token)
    } catch (err: any) {
      console.error('Apple Sign In error:', err)
      // Handle Apple Sign In errors
      if (err.error) {
        if (err.error === 'popup_closed_by_user') {
          setError('Sign in was cancelled')
        } else if (err.error === 'invalid_client') {
          setError('Apple Sign In is not properly configured. Please check your VITE_APPLE_CLIENT_ID and Apple Developer settings. See APPLE_SIGNIN_SETUP.md for instructions.')
        } else {
          setError(err.error || 'Error signing in with Apple')
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Error signing in with Apple')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWizardsLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // Demo mode: Create a demo user with Wizards OAuth
      const demoWizardsUser = {
        sub: `wizards_${Date.now()}`,
        email: `demo-wizards-${Date.now()}@example.com`,
        name: 'Demo Wizards User',
      }

      const response = await axios.post(`${API_URL}/auth/google`, { // Using Google endpoint as placeholder
        providerId: demoWizardsUser.sub,
        email: demoWizardsUser.email,
        name: demoWizardsUser.name,
      })
      const { user, token } = response.data.data
      onLogin(user, token)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error signing in with Wizards')
    } finally {
      setLoading(false)
    }
  }

  const handleDndBeyondLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // NOTE: D&D Beyond does not currently offer a public OAuth API.
      // This implementation is prepared for future integration or partner access.
      // For now, you would need to contact D&D Beyond for API access.
      // 
      // If you have D&D Beyond OAuth credentials, implement the OAuth flow here:
      // 1. Redirect to D&D Beyond authorization URL
      // 2. Handle callback with authorization code
      // 3. Exchange code for access token
      // 4. Get user info from D&D Beyond API
      // 5. Send to backend as shown below

      // For now, show an error explaining the situation
      setError('D&D Beyond authentication is not yet available. D&D Beyond does not currently offer a public OAuth API. Please contact D&D Beyond for partnership opportunities or use another authentication method.')
      
      // TODO: When D&D Beyond OAuth becomes available, uncomment and implement:
      /*
      const response = await axios.post(`${API_URL}/auth/dndbeyond`, {
        providerId: dndBeyondUser.id,
        email: dndBeyondUser.email,
        name: dndBeyondUser.name,
      })
      const { user, token } = response.data.data
      onLogin(user, token)
      */
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error signing in with D&D Beyond')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailPasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
      })
      const { user, token } = response.data.data
      onLogin(user, token)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating account')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })
      const { user, token } = response.data.data
      onLogin(user, token)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error signing in')
    } finally {
      setLoading(false)
    }
  }

  if (showGoogleSelection) {
    return (
      <GoogleAccountSelection
        onAccountSelected={handleGoogleAccountSelected}
        onBack={() => setShowGoogleSelection(false)}
      />
    )
  }

  return (
    <div className="login-container-split">
      {/* Left Panel - Video Background */}
      <div className="login-left-panel-dnd">
        {videos.map((videoSrc, index) => (
          <video
            key={videoSrc}
            className={`login-video-dnd ${index === currentVideoIndex ? 'active' : ''}`}
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ))}
        <div className="video-overlay-dnd"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right-panel-dnd">
        <div className="login-content-dnd">
          {/* Logo */}
          <div className="dnd-logo">
            <span className="logo-dnd-red">WARCHAIN</span>
            <span className="logo-beyond-black"> ARENA</span>
          </div>

          {/* Page Title */}
          <h1 className="page-title-dnd">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>

          {/* Legal Disclaimer */}
          <p className="legal-text-dnd">
            {isLogin 
              ? "By signing in, you agree to follow WCA's " 
              : "By creating a new account, you agree to follow WCA's "}
            <a href="#" className="legal-link-dnd">Terms of Service</a>,{' '}
            <a href="#" className="legal-link-dnd">Code of Conduct</a> and{' '}
            <a href="#" className="legal-link-dnd">Privacy Policy</a>.
          </p>

          {/* Sign-up Buttons */}
          <div className="social-login-dnd">
            {!isLogin && (
              <button 
                className="social-button-dnd social-wizards" 
                type="button"
                onClick={handleWizardsLogin}
                disabled={loading}
              >
                <div className="social-icon-wrapper-dnd">
                  <span className="wizards-w-icon">W</span>
                </div>
                <span className="social-button-text-dnd">Sign up with Wizards</span>
              </button>
            )}

            <button 
              className="social-button-dnd social-dndbeyond-dnd" 
              type="button"
              onClick={handleDndBeyondLogin}
              disabled={loading}
            >
              <div className="social-icon-wrapper-dnd">
                <svg className="social-icon-dndbeyond-dnd" viewBox="0 0 70 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* D&D Beyond Logo - Stylized D&D with dragon ampersand inspired design */}
                  <text x="2" y="19" fontFamily="'Cinzel', serif" fontSize="18" fontWeight="700" fill="#FFFFFF" letterSpacing="0.08em">D</text>
                  <text x="28" y="19" fontFamily="'Cinzel', serif" fontSize="18" fontWeight="700" fill="#FFFFFF" letterSpacing="0.08em">&amp;</text>
                  <text x="42" y="19" fontFamily="'Cinzel', serif" fontSize="18" fontWeight="700" fill="#FFFFFF" letterSpacing="0.08em">D</text>
                </svg>
              </div>
              <span className="social-button-text-dnd">{isLogin ? 'Sign in with D&D Beyond' : 'Sign up with D&D Beyond'}</span>
            </button>

            <button 
              className="social-button-dnd social-apple-dnd" 
              type="button"
              onClick={handleAppleLogin}
              disabled={loading}
            >
              <div className="social-icon-wrapper-dnd">
                <svg className="social-icon-apple-dnd" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#ffffff"/>
                </svg>
              </div>
              <span className="social-button-text-dnd">{isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}</span>
            </button>

            <button 
              className="social-button-dnd social-google-dnd" 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <div className="social-icon-wrapper-dnd">
                <svg className="social-icon-google-dnd" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <span className="social-button-text-dnd">{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="error-message-dnd">{error}</div>}

          {/* Email/Password Form (for both Sign In and Create Account) */}
          <>
            <div className="divider-dnd">
              <span>OR</span>
            </div>

            <form className="email-password-form-dnd" onSubmit={isLogin ? handleEmailPasswordLogin : handleEmailPasswordRegister}>
              <div className="form-group-dnd">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="form-input-dnd"
                />
              </div>

              <div className="form-group-dnd">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="form-input-dnd"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="submit-button-dnd"
              >
                {loading ? (isLogin ? 'Signing in...' : 'Creating...') : (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>
          </>

          {/* Sign In / Create Account Link */}
          <div className="account-toggle-dnd">
            <span className="toggle-text-dnd">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="toggle-link-dnd"
            >
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          {/* Social Media Icons */}
          <div className="social-media-icons-dnd">
            <a href="#" className="social-icon-link-dnd" aria-label="Discord">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
            <a href="#" className="social-icon-link-dnd" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="social-icon-link-dnd" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="#" className="social-icon-link-dnd" aria-label="X (Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="#" className="social-icon-link-dnd" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a href="#" className="social-icon-link-dnd" aria-label="Twitch">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
            </a>
            <a href="#" className="social-icon-link-dnd" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>

          {/* Support Message */}
          <p className="support-text-dnd">
            Please{' '}
            <a href="#" className="support-link-dnd">contact our support team</a>
            {' '}if you're experiencing account issues.
          </p>
        </div>
      </div>
    </div>
  )
}
