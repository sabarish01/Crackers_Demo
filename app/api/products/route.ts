export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, image_url, category_id, stock_quantity, is_available } = body;
    const id = (await import('crypto')).randomUUID();
    await connection.query(
      'INSERT INTO products (id, name, description, price, image_url, category_id, stock_quantity, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description, price, image_url, category_id, stock_quantity, is_available]
    );
    return new Response(JSON.stringify({ success: true, id }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create product', details: String(error) }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Product ID required' }), { status: 400 });
    await connection.query('DELETE FROM products WHERE id = ?', [id]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete product', details: String(error) }), { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Product ID required' }), { status: 400 });
    const body = await req.json();
    const { name, description, price, image_url, category_id, stock_quantity, is_available } = body;
    await connection.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, category_id = ?, stock_quantity = ?, is_available = ? WHERE id = ?',
      [name, description, price, image_url, category_id, stock_quantity, is_available, id]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update product', details: String(error) }), { status: 500 });
  }
}
import { NextRequest } from 'next/server';
import connection from '@/lib/mysql';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Allowed sort options
  const allowedSorts: Record<string, string> = {
    'created_at_desc': 'p.created_at DESC',
    'created_at': 'p.created_at ASC',
    'name': 'p.name ASC'
  };
  let sort = searchParams.get('sort') || 'created_at_desc';
  if (!allowedSorts[sort]) sort = 'created_at_desc';
  const orderBy = allowedSorts[sort];

  // Filters
  const isAvailable = searchParams.has('is_available') ? (searchParams.get('is_available') === 'true' ? 1 : 0) : 1;
  const stockQuantityGt = Number(searchParams.get('stock_quantity_gt')) || 0;
  const limit = Number(searchParams.get('limit')) || 50;
  const categoryId = searchParams.get('category');

  // Build SQL and params
  let sql = `SELECT p.*, c.id AS category_id, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_available = ? AND p.stock_quantity > ?`;
  const params: any[] = [isAvailable, stockQuantityGt];
  if (categoryId && categoryId !== 'all') {
    sql += ' AND p.category_id = ?';
    params.push(categoryId);
  }
  sql += ` ORDER BY ${orderBy} LIMIT ?`;
  params.push(limit);

  try {
    const result = await connection.query(sql, params);
    const rows = Array.isArray(result[0]) ? result[0] : [];
    // Map products to include categories field
    const products = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      image_url: row.image_url,
      stock_quantity: row.stock_quantity,
      is_available: !!row.is_available,
      category_id: row.category_id,
      categories: row.category_id ? { id: row.category_id, name: row.category_name } : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    return new Response(JSON.stringify(products), { status: 200 });
  } catch (error) {
    console.error('Products API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load products', details: String(error) }), { status: 500 });
  }
}
