import { NextRequest, NextResponse } from 'next/server';
import connection from '@/lib/mysql';

export async function POST(req: NextRequest) {
  try {
    const { orderId, payment_screenshot_url, bank_reference_number } = await req.json();
    if (!orderId || !payment_screenshot_url || !bank_reference_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Update the order with payment screenshot and bank reference
    await connection.query(
      'UPDATE orders SET payment_screenshot_url = ?, bank_reference_number = ?, status = ? WHERE id = ?',
      [payment_screenshot_url, bank_reference_number, 'Paid', orderId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment upload error:', error);
    return NextResponse.json({ error: 'Failed to upload payment details', details: String(error) }, { status: 500 });
  }
}
