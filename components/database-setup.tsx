"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Database } from 'lucide-react'
// ...existing code...

export default function DatabaseSetup() {
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const runDatabaseSetup = async () => {
    setSetupStatus('running')
    setMessage('Setting up database tables...')

    try {
      // Call API route to run setup and insert sample data using MySQL
      const res = await fetch('/api/database-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Database setup failed')

      setSetupStatus('success')
      setMessage('Database setup completed successfully! All tables and sample data have been created.')
    } catch (error) {
      console.error('Database setup error:', error)
      setSetupStatus('error')
      setMessage(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Setup
        </CardTitle>
        <CardDescription>
          Set up the required database tables and sample data for the CrackersHub application.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {setupStatus === 'idle' && (
          <Button onClick={runDatabaseSetup} className="w-full">
            Run Database Setup
          </Button>
        )}

        {setupStatus === 'running' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {setupStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {setupStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {setupStatus === 'success' && (
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="w-full"
          >
            Refresh Page
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
