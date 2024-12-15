"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { toast } = useToast()
  const { requestPasswordReset } = useAuth()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Clear previous errors

    setIsLoading(true)
    try {
      await requestPasswordReset(email)

      toast({
        title: "Email Sent Successfully",
        description: "A password reset link has been sent to your email. Please check your inbox and spam folder.",
      } as any)
      
      // Show a success message and keep the user on the same page
      setEmail('') // Clear the email input
      setError('Check your email for password reset instructions. The link will expire in 1 hour.')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      } as any)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-semibold">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your email address to receive a password reset link.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex gap-2 items-center text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 mt-6" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-center text-muted-foreground mt-4">
          <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}