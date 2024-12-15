"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axiosInstance from '@/lib/axios'
import { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  const validatePassword = (password: string) => {
    // Check for minimum length
    if (password.length < 8) return false;

    // Check for at least one digit
    if (!/\d/.test(password)) return false;

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // Check for at least one special character
    if (!/[@#$%^&+=]/.test(password)) return false;

    return true;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please fill in all fields.")
      return
    }
    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address without special characters like '+'.")
      return
    }
    if (!validatePassword(password)) {
      setErrorMessage("Password must be at least 8 characters long and contain at least one digit, one lowercase letter, one uppercase letter, and one special character.")
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }
    setIsLoading(true)
    
    try {
      const response = await axiosInstance.post('/api/users/register', { email, password });
      router.push('/dashboard')
    } catch (error) {
      console.error('Registration error:', error);
      const axiosError = error as AxiosError;
      setErrorMessage(axiosError.response?.data?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordRequirements = () => (
    <div className="text-sm text-muted-foreground space-y-1">
      <p>Password requirements:</p>
      <ul className="list-disc list-inside pl-4 space-y-1">
        <li>Minimum 8 characters long</li>
        <li>At least one uppercase letter (A-Z)</li>
        <li>At least one lowercase letter (a-z)</li>
        <li>At least one number (0-9)</li>
        <li>At least one special character (@#$%^&+=)</li>
      </ul>
    </div>
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center">Register for TradePro</h2>
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="text-destructive">{errorMessage}</span>
          </div>
        )}
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {getPasswordRequirements()}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </form>
        <p className="text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
