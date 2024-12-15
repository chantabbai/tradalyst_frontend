"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react'

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [backendMessage, setBackendMessage] = useState<string | null>(null)
  const { toast } = useToast()
  const { changePassword } = useAuth()

  const handleChangePassword = async () => {
    setBackendMessage(null)
    console.log('Starting password change process...')
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      console.log('Validation failed: Empty fields detected')
      setBackendMessage('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmNewPassword) {
      console.log('Validation failed: New passwords do not match')
      setBackendMessage('New passwords do not match')
      return
    }

    // New password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      console.log('Validation failed: Password does not meet requirements')
      setBackendMessage('Password must meet all requirements')
      return
    }

    setIsChangingPassword(true)
    console.log('All frontend validations passed, sending request to backend...')

    try {
      await changePassword(currentPassword, newPassword)
      console.log('Password change successful')
      setBackendMessage("Your password has been updated successfully.")
      
      // Reset the form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Password change failed:', error)
      setBackendMessage(error instanceof Error ? error.message : "An error occurred while changing the password.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </div>
      
      <Card className="border-none shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-primary/10">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {backendMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
              <span className="text-sm font-medium">{backendMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Include at least one uppercase letter</li>
                  <li>Include at least one number</li>
                  <li>Include at least one special character</li>
                </ul>
              </div>

              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword}
                className="w-full"
              >
                {isChangingPassword ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}