'use client'

import { useEffect } from 'react'
import { setupAxiosInterceptors } from '../utils/auth'

/**
 * Component that initializes auth-related setup like axios interceptors
 */
export default function AuthInitializer() {
  useEffect(() => {
    setupAxiosInterceptors()
  }, [])

  return null
} 