import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    const [rows] = await connection.query('SELECT * FROM customers WHERE phone = ? LIMIT 1', [phone])
    const customer = (rows as any[])[0]
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to lookup customer' }, { status: 500 })
  }
}
