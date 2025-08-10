import { NextRequest } from 'next/server';
import connection from '@/lib/mysql';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const result = await connection.query(
      `SELECT p.*, c.id AS category_id, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? LIMIT 1`,
      [id]
    );
    const rows = Array.isArray(result[0]) ? (result[0] as any[]) : [];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }
    const row = rows[0] as any;
    const product = {
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
    };
    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), { status: 500 });
  }
}
