import { useState, useEffect } from 'react'
import axios from 'axios'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Configure axios to automatically add the authorization token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

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

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const handleLogin = async (loggedInUser: User, newToken: string) => {
    setUser(loggedInUser)
    setToken(newToken)
    localStorage.setItem('token', newToken)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const fetchUser = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`)
      setUser(response.data.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [token])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">⏳</div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App
