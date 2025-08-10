import { NextRequest, NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET(req: NextRequest) {
  try {
    const [rows] = await connection.query('SELECT * FROM promocodes ORDER BY created_at DESC')
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch promocodes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, discount_percentage, min_order_value, expiry_date, is_active } = body
    await connection.query(
      'INSERT INTO promocodes (code, discount_percentage, min_order_value, expiry_date, is_active) VALUES (?, ?, ?, ?, ?)',
      [code, discount_percentage, min_order_value, expiry_date, is_active]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create promocode' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Promocode ID required' }, { status: 400 })
    const body = await req.json()
    const { code, discount_percentage, min_order_value, expiry_date, is_active } = body
    try {
      await connection.query(
        'UPDATE promocodes SET code = ?, discount_percentage = ?, min_order_value = ?, expiry_date = ?, is_active = ? WHERE id = ?',
        [code, discount_percentage, min_order_value, expiry_date, is_active, id]
      )
      return NextResponse.json({ success: true })
    } catch (sqlError: any) {
      console.error('SQL Error in PUT /api/promocodes-admin:', sqlError, { code, discount_percentage, min_order_value, expiry_date, is_active, id })
      return NextResponse.json({ error: sqlError.message || 'Failed to update promocode', details: sqlError }, { status: 500 })
    }
  } catch (error: any) {
    console.error('General Error in PUT /api/promocodes-admin:', error)
    return NextResponse.json({ error: error.message || 'Failed to update promocode', details: error }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Promocode ID required' }, { status: 400 })
    await connection.query('DELETE FROM promocodes WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete promocode' }, { status: 500 })
  }
}
