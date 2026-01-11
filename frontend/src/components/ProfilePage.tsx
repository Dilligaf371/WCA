import { useState, useEffect } from 'react'
import axios from 'axios'
import AnimatedBackground from './AnimatedBackground'
import './ProfilePage.css'

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

interface ProfilePageProps {
  user: User
  onBack: () => void
}

export default function ProfilePage({ user, onBack }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'profile' | 'preferences'>('account')
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([])
  const [displayName, setDisplayName] = useState(user.displayName || user.email.split('@')[0])
  const [bio, setBio] = useState(user.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [characterCount, setCharacterCount] = useState(0)
  const [figurineCount, setFigurineCount] = useState(0)
  const [nftCount, setNftCount] = useState(0)

  // Update state when user prop changes
  useEffect(() => {
    setDisplayName(user.displayName || user.email.split('@')[0])
    setBio(user.bio || '')
    setAvatarUrl(user.avatarUrl || '')
  }, [user])

  // Fetch user statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [charsRes, figsRes] = await Promise.all([
          axios.get(`${API_URL}/characters`).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_URL}/figurines`).catch(() => ({ data: { data: [] } })),
        ])
        setCharacterCount(charsRes.data.data?.length || 0)
        setFigurineCount(figsRes.data.data?.length || 0)
        // NFT count would need its own endpoint
        setNftCount(0)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    // Fetch linked accounts info
    // For now, we'll determine linked accounts from user.provider
    const accounts = [
      {
        name: 'Google',
        provider: 'google',
        linked: user.provider === 'google',
        email: user.provider === 'google' ? user.email : null,
        icon: 'G',
        color: '#4285F4',
      },
      {
        name: 'Apple',
        provider: 'apple',
        linked: user.provider === 'apple',
        email: user.provider === 'apple' ? user.email : null,
        icon: '🍎',
        color: '#000000',
      },
      {
        name: 'D&D Beyond',
        provider: 'dndbeyond',
        linked: user.provider === 'dndbeyond',
        email: user.provider === 'dndbeyond' ? user.email : null,
        icon: 'D&D',
        color: '#C41E3A',
      },
    ]
    setLinkedAccounts(accounts)
  }, [user])

  const handleLinkAccount = async (provider: string) => {
    // TODO: Implement OAuth linking
    console.log(`Link ${provider} account`)
  }

  const handleUnlinkAccount = async (provider: string) => {
    // TODO: Implement account unlinking
    console.log(`Unlink ${provider} account`)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      await axios.put(
        `${API_URL}/auth/profile`,
        { displayName, bio, avatarUrl }
      )

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      
      // Refresh user data to update displayName in parent components
      try {
        const response = await axios.get(`${API_URL}/auth/me`)
        if (response.data?.data) {
          // Update user prop is read-only, so we'll need to refresh the page or use window.location.reload()
          // For now, we'll reload the page to get fresh user data
          window.location.reload()
        }
      } catch (refreshError) {
        console.error('Failed to refresh user data:', refreshError)
      }
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save profile. Please try again.'
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const calculateMemberSince = (createdAt?: string) => {
    if (!createdAt) return 'Unknown'
    const date = new Date(createdAt)
    const now = new Date()
    const years = now.getFullYear() - date.getFullYear()
    const months = now.getMonth() - date.getMonth()
    const days = now.getDate() - date.getDate()
    
    let result = ''
    if (years > 0) result += `${years} year${years > 1 ? 's' : ''}`
    if (months > 0) {
      if (result) result += ', '
      result += `${months} month${months > 1 ? 's' : ''}`
    }
    if (days > 0 && years === 0) {
      if (result) result += ', '
      result += `${days} day${days > 1 ? 's' : ''}`
    }
    return result || 'Less than a month'
  }

  // Background images - same as Dashboard
  const backgroundImages = [
    '/backgrounds/bg1.jpg',
    '/backgrounds/bg2.jpg',
    '/backgrounds/bg3.jpg',
    '/backgrounds/bg4.jpg',
  ]

  return (
    <div className="profile-page">
      <AnimatedBackground images={backgroundImages} interval={5000} />
      <header className="profile-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1>Account</h1>
      </header>

      <main className="profile-main">
        {/* User Info Section */}
        <div className="profile-user-section">
          <div className="profile-user-avatar">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.displayName || user.email.split('@')[0]}
                className="profile-avatar-image"
                onError={(e) => {
                  // Fallback to initial if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLDivElement
                  if (fallback) {
                    fallback.style.display = 'flex'
                  }
                }}
              />
            ) : null}
            <div 
              className="profile-avatar-circle" 
              style={{ display: user.avatarUrl ? 'none' : 'flex' }}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="profile-user-info">
            <h2 className="profile-username">{user.displayName || user.email.split('@')[0]}</h2>
            <div className="profile-user-details">
              <span className="profile-user-badge">Registered User</span>
              <span className="profile-user-member-since">
                Member for {calculateMemberSince(user.createdAt)}
              </span>
            </div>
          </div>
          <div className="profile-user-stats">
            <div className="profile-stat-item">
              <span className="profile-stat-value">{characterCount}</span>
              <span className="profile-stat-label">Characters</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-value">{figurineCount}</span>
              <span className="profile-stat-label">Figurines</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-value">{nftCount}</span>
              <span className="profile-stat-label">NFTs</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {activeTab === 'account' && (
            <div className="profile-tab-content">
              <div className="profile-content-grid">
                {/* Linked Accounts */}
                <div className="profile-section">
                  <h3 className="profile-section-title">Link your account to any of the following</h3>
                  <p className="profile-section-subtitle">You may only link one of each at a time.</p>
                  <div className="linked-accounts-list">
                    {linkedAccounts.map((account) => (
                      <div key={account.provider} className="linked-account-item">
                        <div className="linked-account-icon">
                          {account.icon === 'G' ? (
                            <div className="google-icon" style={{ backgroundColor: account.color }}>G</div>
                          ) : account.icon === '🍎' ? (
                            <div className="apple-icon" style={{ backgroundColor: account.color }}>🍎</div>
                          ) : (
                            <div className="dnd-icon" style={{ color: account.color }}>D&D</div>
                          )}
                        </div>
                        <div className="linked-account-info">
                          <div className="linked-account-name">{account.name}</div>
                          {account.linked ? (
                            <div className="linked-account-status">
                              <span className="linked-account-email">{account.email}</span>
                              <button 
                                className="linked-account-action"
                                onClick={() => handleUnlinkAccount(account.provider)}
                              >
                                Unlink Account
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="linked-account-action"
                              onClick={() => handleLinkAccount(account.provider)}
                            >
                              Link Account
                            </button>
                          )}
                        </div>
                        <div className="linked-account-chain">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 7H5C4.44772 7 4 7.44772 4 8V12C4 12.5523 4.44772 13 5 13H7M13 7H15C15.5523 7 16 7.44772 16 8V12C16 12.5523 15.5523 13 15 13H13M7 10H13" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Info */}
                <div className="profile-section">
                  <h3 className="profile-section-title">Account Information</h3>
                  <div className="account-info-list">
                    <div className="account-info-item">
                      <span className="account-info-label">Email:</span>
                      <span className="account-info-value">{user.email}</span>
                    </div>
                    {user.walletAddress && (
                      <div className="account-info-item">
                        <span className="account-info-label">Wallet Address:</span>
                        <span className="account-info-value account-info-wallet">{user.walletAddress}</span>
                      </div>
                    )}
                    <div className="account-info-item">
                      <span className="account-info-label">Account Type:</span>
                      <span className="account-info-value">{user.provider ? `${user.provider.charAt(0).toUpperCase() + user.provider.slice(1)} Account` : 'Email/Password Account'}</span>
                    </div>
                    <div className="account-info-item">
                      <span className="account-info-label">Member Since:</span>
                      <span className="account-info-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <h3 className="profile-section-title">Profile Information</h3>
                <p className="profile-section-subtitle">Customize your public profile</p>
                <div className="profile-form">
                  <div className="form-group">
                    <label>Profile Photo URL</label>
                    <input 
                      type="url" 
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    {avatarUrl && (
                      <div className="avatar-preview-container">
                        <div className="avatar-preview">
                          <img 
                            src={avatarUrl} 
                            alt="Avatar preview" 
                            className="avatar-preview-image"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const errorMsg = target.nextElementSibling as HTMLElement
                              if (errorMsg) errorMsg.style.display = 'block'
                            }}
                          />
                          <div className="avatar-preview-error" style={{ display: 'none' }}>
                            Unable to load image. Please check the URL.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={user.email.split('@')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea 
                      rows={4} 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                    ></textarea>
                  </div>
                  <button 
                    className="profile-save-button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="profile-tab-content">
              <div className="profile-section">
                <h3 className="profile-section-title">Preferences</h3>
                <p className="profile-section-subtitle">Customize your experience</p>
                <div className="preferences-list">
                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Email Notifications</span>
                      <span className="preference-description">Receive email updates about your characters and campaigns</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="preference-item">
                    <div className="preference-info">
                      <span className="preference-label">Character Sync</span>
                      <span className="preference-description">Automatically sync characters from D&D Beyond</span>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
