import { useState, useEffect } from 'react'
import axios from 'axios'
import CharactersPage from './CharactersPage'
import ProfilePage from './ProfilePage'
import AnimatedBackground from './AnimatedBackground'
import './Dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface User {
  id: string
  email: string
  walletAddress: string | null
  provider?: string | null
  createdAt?: string
  displayName?: string | null
  bio?: string | null
  avatarUrl?: string | null
}

interface DashboardProps {
  user: User
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [characters, setCharacters] = useState<any[]>([])
  const [figurines, setFigurines] = useState<any[]>([])
  const [currentView, setCurrentView] = useState<'dashboard' | 'characters' | 'profile'>('dashboard')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [charsRes, figsRes] = await Promise.all([
        axios.get(`${API_URL}/characters`).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/figurines`).catch(() => ({ data: { data: [] } })),
      ])
      setCharacters(charsRes.data.data || [])
      setFigurines(figsRes.data.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  if (currentView === 'characters') {
    return <CharactersPage onBack={() => setCurrentView('dashboard')} />
  }

  if (currentView === 'profile') {
    return <ProfilePage user={user} onBack={() => setCurrentView('dashboard')} />
  }

  // Background images - add your images to /public/backgrounds/ folder
  const backgroundImages = [
    '/backgrounds/bg1.jpg',
    '/backgrounds/bg2.jpg',
    '/backgrounds/bg3.jpg',
    '/backgrounds/bg4.jpg',
  ]

  return (
    <div className="dashboard-container">
      <AnimatedBackground images={backgroundImages} interval={5000} />
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>
              <div className="logo-warchain">WARCHAIN</div>
              <div className="logo-arena-dash">ARENA</div>
            </h1>
          </div>
          <div className="welcome-section-header">
            <h2>Welcome, {user.displayName || user.email.split('@')[0]}!</h2>
            <p>Manage your characters, figurines and NFTs</p>
          </div>
          <div className="user-section">
            <div className="profile-menu-container">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)} 
                className="profile-menu-button"
              >
                <span className="profile-email">{user.displayName || user.email.split('@')[0]}</span>
                <svg className="profile-menu-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showProfileMenu && (
                <>
                  <div className="profile-menu-overlay" onClick={() => setShowProfileMenu(false)} />
                  <div className="profile-menu-dropdown">
                    <div className="profile-menu-header">
                      <div className="profile-menu-email">{user.displayName || user.email.split('@')[0]}</div>
                      {user.walletAddress && (
                        <div className="profile-menu-wallet">
                          {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                        </div>
                      )}
                    </div>
                    <div className="profile-menu-divider"></div>
                    <button 
                      className="profile-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false)
                        setCurrentView('profile')
                      }}
                    >
                      <svg className="profile-menu-item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
                        <path d="M8 10C4.68629 10 2 11.7909 2 14V16H14V14C14 11.7909 11.3137 10 8 10Z" fill="currentColor"/>
                      </svg>
                      <span>Profile Settings</span>
                    </button>
                    <button 
                      className="profile-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false)
                        // TODO: Navigate to account settings
                      }}
                    >
                      <svg className="profile-menu-item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 14.4C4.69706 14.4 2 11.7029 2 8C2 4.29706 4.69706 1.6 8 1.6C11.3029 1.6 14 4.29706 14 8C14 11.7029 11.3029 14.4 8 14.4ZM8 4C7.33726 4 6.8 4.53726 6.8 5.2C6.8 5.86274 7.33726 6.4 8 6.4C8.66274 6.4 9.2 5.86274 9.2 5.2C9.2 4.53726 8.66274 4 8 4ZM6.8 8V12.8H9.2V8H6.8Z" fill="currentColor"/>
                      </svg>
                      <span>Account</span>
                    </button>
                    <div className="profile-menu-divider"></div>
                    <button 
                      className="profile-menu-item profile-menu-item-danger"
                      onClick={() => {
                        setShowProfileMenu(false)
                        onLogout()
                      }}
                    >
                      <svg className="profile-menu-item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6M10 11L14 7M14 7L10 3M14 7H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <div className="card-header">
              <h3>Characters</h3>
              <span className="count">{characters.length}</span>
            </div>
            <p className="card-description">Manage your D&D characters</p>
            <button className="card-button" onClick={() => setCurrentView('characters')}>
              View my characters
            </button>
            {characters.length > 0 && (
              <div className="card-list">
                {characters.slice(0, 3).map((char) => (
                  <div key={char.id} className="list-item">
                    {char.name} - Level {char.level}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <div className="card-header">
              <h3>🏺 Figurines</h3>
              <span className="count">{figurines.length}</span>
            </div>
            <p className="card-description">Manage your NFC figurines</p>
            <button className="card-button" onClick={() => window.alert('Coming soon')}>
              View my figurines
            </button>
            {figurines.length > 0 && (
              <div className="card-list">
                {figurines.slice(0, 3).map((fig) => (
                  <div key={fig.id} className="list-item">
                    NFC: {fig.nfcUid.slice(0, 8)}...
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <div className="card-header">
              <h3>💎 NFTs</h3>
              <span className="count">
                {figurines.filter((f) => f.tokenId).length}
              </span>
            </div>
            <p className="card-description">Manage your NFTs on Polygon</p>
            <button className="card-button" onClick={() => window.alert('Coming soon')}>
              View my NFTs
            </button>
            {user.walletAddress && (
              <div className="wallet-info">
                <strong>Wallet:</strong> {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </div>
            )}
          </section>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-button" onClick={() => setCurrentView('characters')}>
              ➕ Import Character
            </button>
            <button className="action-button">
              🔗 Link NFC Figurine
            </button>
            <button className="action-button">
              🪙 Mint NFT
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
