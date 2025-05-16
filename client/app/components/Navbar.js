'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { getProfile } from '../utils/profile'
import style from './Navbar.module.css'
import '../style.css'

export default function Navbar() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserProfile = async () => {
        try {
          const profile = await getProfile()
          setUserProfile(profile)
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
      fetchUserProfile()
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.push('/login')
    setLoggingOut(false)
  }

  const getUserInitials = () => {
    if (!userProfile) return '?'
    const firstName = userProfile.first_name || ''
    const lastName = userProfile.last_name || ''
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  }

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }

  return (
    <div className={style.navbar_container}>
      <div className={style.navbar_inner_container}>
        <div className='logo'>
          <Link href="/">
            FitFusion
          </Link>
        </div>

        <div className={style.right_inner_container}>
          <div>
            <Link href="/">Home</Link>
          </div>
          <div>
            {isAuthenticated && (
              <Link href="/dashboard">Dashboard</Link>
            )}
          </div>
          {isLoading ? (
            <span>Loading...</span>
          ) : isAuthenticated ? (
            <div className={style.profile_dropdown_container} ref={dropdownRef}>
              <div className={style.profile_avatar} onClick={toggleDropdown}>
                {userProfile?.profile_image ? (
                  <img
                    src={userProfile.profile_image}
                    alt="Profile"
                    className={style.profile_image}
                  />
                ) : (
                  <div className={style.profile_initials}>
                    {getUserInitials()}
                  </div>
                )}
              </div>
              {dropdownOpen && (
                <div className={style.profile_dropdown}>
                  <div className={style.dropdown_item}>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
                  </div>
                  <div className={style.dropdown_item}>
                    <Link href="/admin/fitness-content" onClick={() => setDropdownOpen(false)}>Add Content</Link>
                  </div>
                  <div className={style.dropdown_item}>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className='btn btn-danger'
                    >
                      {loggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={style.navbar_auth_container}>
              <div>
                <Link href="/login">Login</Link>
              </div>
              <div>
                <Link href="/register">Register</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
