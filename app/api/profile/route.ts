import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import connection from '@/lib/mysql';

// Example: Update customer profile by phone
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, name, email, address, pincode } = body;
  if (!phone || !name || !email || !address || !pincode) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    // Update customer profile
    const [result] = await connection.query(
      'UPDATE customers SET name = ?, email = ?, address = ?, pincode = ? WHERE phone = ?',
      [name, email, address, pincode, phone]
    );
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'No customer found with this phone number' }, { status: 404 });
    }
    // Return updated customer
    const [rows] = await connection.query(
      'SELECT id, name, email, phone, address, pincode FROM customers WHERE phone = ?',
      [phone]
    );
    const customer = (rows as any[])[0];
    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Profile update failed', details: String(error) }, { status: 500 });
  }
}
