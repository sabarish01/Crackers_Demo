import { NextRequest, NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET(req: NextRequest) {
  try {
    const [rows] = await connection.query(
      `SELECT id, name, email, phone, address, pincode, created_at FROM customers ORDER BY created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 })
  }
}
