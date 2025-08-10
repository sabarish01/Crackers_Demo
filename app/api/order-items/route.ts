import { NextRequest, NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const order_id = url.searchParams.get('order_id')
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 })
    const [rows] = await connection.query(
      `SELECT oi.*, p.id as product_id, p.name, p.image_url, p.stock_quantity
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order_id]
    )
    const items = (rows as any[]).map((item: any) => ({
      ...item,
      products: {
        id: item.product_id,
        name: item.name,
        image_url: item.image_url,
        stock_quantity: item.stock_quantity
      }
    }))
    return NextResponse.json(items)
  } catch (error: any) {
    // Log error to server console for debugging
    console.error('Order Items API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order items' }, { status: 500 })
  }
}
