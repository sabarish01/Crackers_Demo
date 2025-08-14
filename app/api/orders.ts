import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET() {
  try {
    const [orders] = await connection.query(
      `SELECT o.*, o.courier_bill_image, o.courier_partner, o.tracking_number, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC`
    )
    const ordersWithItems = await Promise.all(
      (orders as any[]).map(async (order: any) => {
        const [items] = await connection.query(
          `SELECT oi.*, p.id as product_id, p.name, p.image_url, p.stock_quantity
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        )
        return {
          ...order,
          courier_bill_image: order.courier_bill_image || null,
          courier_partner: order.courier_partner || '',
          tracking_number: order.tracking_number || '',
          customers: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone
          },
          order_items: (items as any[]).map((item: any) => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            products: {
              id: item.product_id,
              name: item.name,
              image_url: item.image_url,
              stock_quantity: item.stock_quantity
            }
          }))
        }
      })
    )
    return NextResponse.json(ordersWithItems)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
