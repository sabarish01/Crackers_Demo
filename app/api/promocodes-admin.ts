import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'
import fs from 'fs';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const [rows] = await connection.query('SELECT * FROM promocodes ORDER BY created_at DESC')
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch promocodes' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  console.log('POST /api/promocodes-admin called');
  try {
    console.log('Parsing request body...');
    const body = await req.json();
    console.log('Request body:', body);
    let { code, discount_percentage, min_order_value, expiry_date, is_active } = body;

    // Basic validation
    if (!code || typeof discount_percentage === 'undefined' || typeof min_order_value === 'undefined' || !expiry_date) {
      console.log('Validation failed:', { code, discount_percentage, min_order_value, expiry_date });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure expiry_date is in YYYY-MM-DD format (MySQL DATE)
    if (typeof expiry_date === 'string' && expiry_date.includes('T')) {
      expiry_date = expiry_date.split('T')[0];
    }
    console.log('Prepared values:', { code, discount_percentage, min_order_value, expiry_date, is_active });

    try {
      const id = randomUUID();
      console.log('Generated UUID:', id);
      const query = `INSERT INTO promocodes (id, code, discount_percentage, min_order_value, expiry_date, is_active) VALUES (?, ?, ?, ?, ?, ?)`;
      const params = [id, code, discount_percentage, min_order_value, expiry_date, is_active ? 1 : 0];
      console.log('Running query:', query, params);
      const [result] = await connection.query(query, params);
      console.log('Insert result:', result);
      return NextResponse.json({ success: true, id });
    } catch (sqlError: any) {
      // Log SQL error details
      const errorMsg = `SQL Error: ${sqlError?.message || sqlError}\nStack: ${sqlError?.stack || ''}\nSQL: ${sqlError?.sql || ''}\n`;
      try {
        fs.appendFileSync('promocode-error.log', errorMsg);
      } catch (fileErr) {
        console.error('Failed to write error log file:', fileErr);
      }
      console.error('SQL error object:', sqlError);
      console.error(errorMsg);
      return NextResponse.json({
        error: 'Failed to create promocode',
        details: sqlError?.message || String(sqlError),
        sql: sqlError?.sqlMessage || sqlError?.sql || null,
        full: sqlError
      }, { status: 500 });
    }
  } catch (error: any) {
    // Log full error details
    console.error('POST /api/promocodes-admin error:', error);
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return NextResponse.json({
      error: 'Failed to create promocode',
      details: error?.message || String(error),
      sql: error?.sqlMessage || error?.sql || null,
      full: error
    }, { status: 500 });
  }
}
