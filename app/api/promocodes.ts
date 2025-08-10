import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const [rows] = await connection.query(
      'SELECT * FROM promocodes WHERE is_active = 1 AND expiry_date >= ? ORDER BY discount_percentage DESC',
      [today]
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch promocodes' }, { status: 500 })
  }
}
