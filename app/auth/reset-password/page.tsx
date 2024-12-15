"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { useAuth } from '@/context/AuthContext'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' })
  const [serverError, setServerError] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const { resetPassword } = useAuth()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const validatePassword = (password: string) => {
    if (password.length < 8) return false;

    if (!/\d/.test(password)) return false;

    if (!/[a-z]/.test(password)) return false;

    if (!/[A-Z]/.test(password)) return false;

    if (!/[@#$%^&+=]/.test(password)) return false;

    return true;
  }

  const validateForm = () => {
    let isValid = true;
    const newErrors = { password: '', confirmPassword: '' };

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 8 characters long and contain at least one digit, one lowercase letter, one uppercase letter, and one special character (@#$%^&+=)';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    
    if (!token) {
      setServerError('The reset link appears to be invalid. Please request a new password reset link.')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(token, password)
      toast({
        title: "Success!",
        description: "Your password has been successfully reset. You can now log in with your new password.",
      } as any)
      
      // Add a small delay before redirecting to make sure the user sees the success message
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password'
      setServerError(errorMessage)
      toast({
        title: "Password Reset Failed",
        description: `${errorMessage}. Please try again or request a new reset link.`,
        variant: "destructive",
      } as any)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-3 ring-1 ring-primary/20">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex gap-2 items-center text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{serverError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }))
                    }
                  }}
                  className={`h-11 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
              {errors.password && (
                <div className="text-sm text-destructive mt-1">
                  {errors.password}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) {
                      setErrors(prev => ({ ...prev, confirmPassword: '' }))
                    }
                  }}
                  className={`h-11 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
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
              {errors.confirmPassword && (
                <div className="text-sm text-destructive mt-1">
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {getPasswordRequirements()}
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    <span>Resetting password...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t pt-6">
          <div className="text-sm text-center text-muted-foreground">
            Remember your password?{' '}
            <Link 
              href="/auth/login" 
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 