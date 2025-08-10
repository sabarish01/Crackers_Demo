import { NextRequest } from 'next/server';
import connection from '@/lib/mysql';
import { randomUUID } from 'crypto';

// GET all categories
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const allowedSorts = ['name', 'created_at', 'id'];
  let sort = searchParams.get('sort') || 'name';
  if (!allowedSorts.includes(sort)) sort = 'name';
  try {
    const [rows] = await connection.query(
      `SELECT * FROM categories ORDER BY ${sort}`
    );
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (error) {
    console.error('Categories API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load categories', details: String(error) }), { status: 500 });
  }
}

// POST create category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, image_url } = body;
    if (!name || !description || !image_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    try {
      const id = randomUUID();
      await connection.query(
        'INSERT INTO categories (id, name, description, image_url) VALUES (?, ?, ?, ?)',
        [id, name, description, image_url]
      );
      return new Response(JSON.stringify({ success: true, id }), { status: 201 });
    } catch (sqlError: any) {
      console.error('POST /api/categories SQL Error:', sqlError);
      return new Response(JSON.stringify({
        error: 'Failed to create category',
        details: sqlError?.message || String(sqlError),
        sql: sqlError?.sqlMessage || sqlError?.sql || null,
        full: sqlError
      }), { status: 500 });
    }
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create category', details: String(error) }), { status: 500 });
  }
}

// PUT update category
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Missing category id' }), { status: 400 });
    const body = await req.json();
    const { name, description, image_url } = body;
    if (!name || !description || !image_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    await connection.query(
      'UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?',
      [name, description, image_url, id]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update category', details: String(error) }), { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Missing category id' }), { status: 400 });

    // Get image_url before deleting
  const [rows] = await connection.query('SELECT image_url FROM categories WHERE id = ?', [id]);
  const image_url = (Array.isArray(rows) && rows[0]) ? (rows[0] as any).image_url : undefined;

    // Delete category from DB
    await connection.query('DELETE FROM categories WHERE id = ?', [id]);

    // Delete image file if it exists and is not a placeholder
    if (image_url && image_url.startsWith('/upload/category/')) {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'public', image_url);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete category', details: String(error) }), { status: 500 });
  }
}
