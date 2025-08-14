"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import connection from '@/lib/mysql'
import { ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'reset'>('phone')
  const [formData, setFormData] = useState({
    phone: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerData, setCustomerData] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/customers-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      })
      if (!res.ok) {
        setError('Phone number not found')
        setLoading(false)
        return
      }
      if (!res.ok) {
        throw new Error('Failed to lookup customer')
      }
      const customer = await res.json()
      setCustomerData(customer)
      setStep('reset')
      toast({
        title: "Phone Verified",
        description: "Please enter your new password",
      })
    } catch (error) {
      console.error('Phone verification error:', error)
      setError('An error occurred during verification')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/customers-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customerData.id, newPassword: formData.newPassword })
      })
      if (!res.ok) {
        setError('An error occurred during password reset')
        setLoading(false)
        return
      }
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated",
      })
      router.push('/login')
    } catch (error) {
      console.error('Password reset error:', error)
      setError('An error occurred during password reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 flex items-center justify-center px-2 sm:px-0 py-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2 sm:mb-4">
            <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 text-orange-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-orange-800">
            {step === 'phone' ? 'Reset Password' : 'Create New Password'}
          </CardTitle>
          <CardDescription className="text-xs sm:text-base">
            {step === 'phone' 
              ? 'Enter your phone number to reset your password'
              : 'Enter your new password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your registered phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Phone"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-3 sm:space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="text-sm sm:text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm sm:text-base"
                onClick={() => setStep('phone')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Phone Verification
              </Button>
            </form>
          )}

          <div className="mt-4 sm:mt-6 text-center">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
