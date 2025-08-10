import { NextRequest } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, price, image_url, category_id, stock_quantity, is_available } = body
    await connection.query(
      'INSERT INTO products (name, description, price, image_url, category_id, stock_quantity, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, image_url, category_id, stock_quantity, is_available]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    const body = await req.json()
    const { name, description, price, image_url, category_id, stock_quantity, is_available } = body
    await connection.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, stock_quantity = ?, is_available = ? WHERE id = ?',
      [name, description, price, image_url, category_id, stock_quantity, is_available, id]
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    await connection.query('DELETE FROM products WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET() {
  try {
    const [rows] = await connection.query(
      `SELECT p.*, c.id as category_id, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.name`
    );
    console.log('Raw SQL rows:', rows);
    const products = (rows as any[]).map((row: any) => ({
      ...row,
      categories: row.category_id ? { id: row.category_id, name: row.category_name } : null
    }));
    console.log('Mapped products:', products);
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
