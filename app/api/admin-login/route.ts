import { NextRequest, NextResponse } from 'next/server'
import { loginAdmin, checkAdminExists, createAdminUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const admin = await loginAdmin(username, password)
    return NextResponse.json({ success: true, admin })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Invalid credentials' }, { status: 401 })
  }
}

export async function GET() {
  try {
    const exists = await checkAdminExists()
    return NextResponse.json({ exists })
  } catch (error: any) {
    return NextResponse.json({ exists: false, message: error.message || 'Error checking admin' }, { status: 500 })
  }
}

export async function PUT() {
  try {
    await createAdminUser()
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create admin user' }, { status: 500 })
  }
}
