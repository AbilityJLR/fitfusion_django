'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'

const PUBLIC_PATHS = ['/', '/login', '/register', '/profile/setup']

export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return;

    if (pathname === '/login' && isAuthenticated) {
      router.push('/dashboard');
      return;
    }

    if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (pathname === '/login' && isAuthenticated) {
    return null;
  }

  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
} 
