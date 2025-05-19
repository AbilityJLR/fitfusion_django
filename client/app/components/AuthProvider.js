'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initAuth, isAuthenticated, logout } from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only run on the client
        if (typeof window !== 'undefined') {
          initAuth()
          
          const authenticated = await isAuthenticated()
          setAuth({
            isAuthenticated: authenticated,
            isLoading: false
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuth({
          isAuthenticated: false,
          isLoading: false
        })
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      setAuth({
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        ...auth, 
        logout: handleLogout,
        setAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 