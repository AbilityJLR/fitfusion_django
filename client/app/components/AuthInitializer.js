'use client'

import { useEffect } from 'react'
import { setupAxiosInterceptors } from '../utils/auth'

/**
 * Component that initializes auth-related setup like axios interceptors
 */
export default function AuthInitializer() {
  useEffect(() => {
    // Only run on the client
    if (typeof window !== 'undefined') {
      setupAxiosInterceptors()
    }
  }, [])

  return null
} 