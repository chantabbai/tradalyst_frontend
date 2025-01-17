
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
      if (!token || !isAuthenticated) {
        router.push('/auth/login')
      }
      setIsValidating(false)
    }

    validateSession()
  }, [router])

  // Show nothing while validating to prevent flash
  if (isValidating) {
    return null
  }

  // Only show children if authenticated
  return isAuthenticated ? <>{children}</> : null
}
