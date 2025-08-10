import { NextRequest } from 'next/server';
import connection from '@/lib/mysql';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, password } = body;
  if (!phone || !password) {
    return new Response(JSON.stringify({ error: 'Phone and password are required' }), { status: 400 });
  }
  try {
    const [rows] = await connection.query(
      'SELECT * FROM customers WHERE phone = ? LIMIT 1',
      [phone]
    );
    const customer = (rows as any[])[0];
    if (!customer || customer.password !== password) {
      return new Response(JSON.stringify({ error: 'Invalid phone or password' }), { status: 401 });
    }
    delete customer.password;
    return new Response(JSON.stringify({ customer }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Login failed' }), { status: 500 });
  }
}
