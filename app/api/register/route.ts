import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import connection from '@/lib/mysql';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, password } = body;
  if (!name || !email || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    // Check for duplicate phone or email
    const [existingRows] = await connection.query(
      'SELECT * FROM customers WHERE phone = ? OR email = ? LIMIT 1',
      [phone, email]
    );
    const existing = (existingRows as any[])[0];
    if (existing) {
      return NextResponse.json({ error: 'Phone or email already registered' }, { status: 409 });
    }
    // Find max id and increment for new customer
    const [maxRows] = await connection.query('SELECT MAX(id) as maxId FROM customers');
    const maxIdRaw = (maxRows as any[])[0]?.maxId;
    const nextId = typeof maxIdRaw === 'number' && !isNaN(maxIdRaw) ? maxIdRaw + 1 : 1;
    // Create new customer with explicit numeric id
    await connection.query(
      'INSERT INTO customers (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [nextId, name, email, phone, password]
    );
    // Fetch the newly created customer
    const [rows] = await connection.query(
      'SELECT * FROM customers WHERE id = ?',
      [nextId]
    );
    const customer = (rows as any[])[0];
    if (customer) delete customer.password;
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed', details: String(error) }, { status: 500 });
  }
}
