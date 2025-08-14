import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    console.log('[PROMO API] Received code:', code);
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await connection.query(
      'SELECT * FROM promocodes WHERE code = ? AND is_active = 1 AND expiry_date >= ? LIMIT 1',
      [code.toUpperCase(), today]
    );
    console.log('[PROMO API] DB result:', rows);
    const promo = (rows as any[])[0];
    if (!promo) {
      console.log('[PROMO API] No valid promo found for code:', code);
      return NextResponse.json({ error: 'Invalid or expired promo code' }, { status: 404 });
    }
    console.log('[PROMO API] Promo found:', promo);
    return NextResponse.json(promo);
  } catch (error) {
    console.error('[PROMO API] Error:', error);
    return NextResponse.json({ error: 'Failed to validate promo code' }, { status: 500 });
  }
}
