import { NextRequest, NextResponse } from 'next/server';
import connection from '@/lib/mysql';

export async function DELETE(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }
    // Clear payment_screenshot_url and bank_reference_number, and set status back to 'Accepted'
    await connection.query(
      'UPDATE orders SET payment_screenshot_url = NULL, bank_reference_number = NULL, status = ? WHERE id = ?',
      ['Accepted', orderId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment screenshot delete error:', error);
    return NextResponse.json({ error: 'Failed to delete payment screenshot', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, payment_screenshot_url, bank_reference_number } = await req.json();
    if (!orderId || !payment_screenshot_url || !bank_reference_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Update the order with payment screenshot and bank reference
    // Do NOT auto-mark as 'Paid' here; keep existing status (e.g., 'Accepted') until admin verifies
    await connection.query(
      'UPDATE orders SET payment_screenshot_url = ?, bank_reference_number = ? WHERE id = ?',
      [payment_screenshot_url, bank_reference_number, orderId]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment upload error:', error);
    return NextResponse.json({ error: 'Failed to upload payment details', details: String(error) }, { status: 500 });
  }
}
