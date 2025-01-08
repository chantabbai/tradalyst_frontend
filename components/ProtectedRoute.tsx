
"use client"

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token')
      if (!token && !isAuthenticated) {
        router.push('/auth/login')
      }
      setIsValidating(false)
    }

    validateSession()
  }, [router, isAuthenticated])

  // Show nothing while validating to prevent flash
  if (isValidating) {
    return null
  }

  // Show children if there's a token, even while validating auth state
  return localStorage.getItem('token') ? <>{children}</> : null
}
