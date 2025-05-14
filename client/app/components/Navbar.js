'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
    setLoggingOut(false)
  }

  return (
    <nav className="flex justify-between items-center p-4 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex space-x-4">
        <Link href="/" className="text-gray-800 hover:text-blue-600 transition">Home</Link>
        {isAuthenticated && (
          <Link href="/dashboard" className="text-gray-800 hover:text-blue-600 transition">Dashboard</Link>
        )}
      </div>
      
      <div>
        {isLoading ? (
          <span className="text-gray-500">Loading...</span>
        ) : isAuthenticated ? (
          <button 
            onClick={handleLogout} 
            disabled={loggingOut}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-70"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        ) : (
          <div className="flex space-x-4">
            <Link href="/login" className="text-gray-800 hover:text-blue-600 transition">Login</Link>
            <Link href="/register" className="text-gray-800 hover:text-blue-600 transition">Register</Link>
          </div>
        )}
      </div>
    </nav>
  )
} 