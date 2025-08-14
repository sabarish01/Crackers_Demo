"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
// import { loginAdmin, createAdminUser, checkAdminExists } from '@/lib/auth'
import { Shield, User, Lock, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [adminExists, setAdminExists] = useState(true)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAdminUser = async () => {
      try {
        setCheckingAdmin(true)
        const res = await fetch('/api/admin-login')
        const data = await res.json()
        setAdminExists(!!data.exists)
        console.log('Admin exists:', data.exists)
      } catch (error) {
        console.error('Error checking admin:', error)
        setAdminExists(false)
      } finally {
        setCheckingAdmin(false)
      }
    }
    checkAdminUser()
  }, [])

  const handleCreateAdmin = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin-login', { method: 'PUT' })
      const data = await res.json()
      if (data.success) {
        setAdminExists(true)
        toast({
          title: "Success",
          description: "Admin user created successfully. You can now login.",
        })
      } else {
        throw new Error(data.message || 'Failed to create admin user')
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create admin user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      })
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Invalid credentials')
      const admin = data.admin
      login(admin)
      toast({
        title: "Success",
        description: `Welcome back, ${admin.username}!`,
      })
      router.push('/admin/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p>Checking admin user...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 px-2 sm:px-0">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-orange-100">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-orange-800">Admin Login</CardTitle>
          <CardDescription className="text-xs sm:text-base">
            Access the CrackersHub admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!adminExists && (
            <Alert className="mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No admin user found. Please create an admin user first.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
                disabled={loading || !adminExists}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {!adminExists && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                  onClick={handleCreateAdmin}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Admin User"}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
            <p>Default credentials:</p>
            <p><strong>Username:</strong> admin</p>
            <p><strong>Password:</strong> admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
