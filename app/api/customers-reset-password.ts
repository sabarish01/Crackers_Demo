import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function POST(req: Request) {
  try {
    const { id, newPassword } = await req.json()
    await connection.query('UPDATE customers SET password = ? WHERE id = ?', [newPassword, id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
