import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function GET() {
  try {
    const [rows] = await connection.query('SELECT * FROM categories ORDER BY name')
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}


// Update category
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    const body = await req.json();
    const { name, description, image_url } = body;
    if (!name || !description || !image_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const [result] = await connection.query(
      'UPDATE categories SET name = ?, description = ?, image_url = ? WHERE id = ?',
      [name, description, image_url, id]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update category', details: error?.message || String(error) }, { status: 500 });
  }
}

// Delete category
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
    await connection.query('DELETE FROM categories WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete category', details: error?.message || String(error) }, { status: 500 });
  }
}
