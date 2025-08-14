
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
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
    // Create new customer with UUID
    const id = uuidv4();
    await connection.query(
      'INSERT INTO customers (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, phone, password]
    );
    // Fetch the newly created customer
    const [rows] = await connection.query(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    const customer = (rows as any[])[0];
    if (customer) delete customer.password;
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed', details: String(error) }, { status: 500 });
  }
}
