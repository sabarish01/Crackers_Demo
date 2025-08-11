import { NextResponse } from 'next/server'
import connection from '@/lib/mysql'
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

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

    // Validate code length
    if (code.length > 50) {
      return NextResponse.json({ error: 'Code exceeds maximum length of 50 characters' }, { status: 400 });
    }

    // Ensure expiry_date is in YYYY-MM-DD format (MySQL DATE)
    if (typeof expiry_date === 'string' && expiry_date.includes('T')) {
      expiry_date = expiry_date.split('T')[0];
    }
    console.log('Prepared values:', { code, discount_percentage, min_order_value, expiry_date, is_active });

    try {
      // Dynamically generate a unique UUID for the id field
      const id = uuidv4();
      console.log('Generated unique UUID:', id);

      // Log the generated ID to ensure it's being created
      console.log('Generated ID:', id);

      // Log confirmation of UUID generation
      console.log('UUID generation confirmed:', id);

      // Parse discount_percentage as a decimal
      discount_percentage = parseFloat(discount_percentage);

      // Prepare query and parameters
      const query = `INSERT INTO promocodes (id, code, discount_percentage, min_order_value, expiry_date, is_active) VALUES (?, ?, ?, ?, ?, ?)`;
      const params = [id, code, discount_percentage, min_order_value, expiry_date, is_active ? 1 : 0];

      console.log('Prepared params:', params);
      console.log('Running query:', query, params);

      // Execute query
      const [result] = await connection.query(query, params);
      console.log('Insert result:', result);
      // Include the generated ID in the response
      return NextResponse.json({ success: true, id, message: 'Promocode created successfully' });
    } catch (sqlError: any) {
      // Enhanced logging for SQL errors
      console.error('SQL error occurred:', sqlError);
      if (sqlError && sqlError.stack) {
        console.error('SQL error stack trace:', sqlError.stack);
      }
      console.error('SQL error details:', {
        message: sqlError?.message,
        sql: sqlError?.sqlMessage || sqlError?.sql,
        code: sqlError?.code,
        errno: sqlError?.errno,
        sqlState: sqlError?.sqlState,
      });
      return NextResponse.json({
        error: 'Failed to create promocode',
        details: sqlError?.message || String(sqlError),
        sql: sqlError?.sqlMessage || sqlError?.sql || null,
        stack: sqlError?.stack || null,
        full: sqlError
      }, { status: 500 });
    }
  } catch (error: any) {
    // Enhanced logging for general errors
    console.error('POST /api/promocodes-admin error occurred:', error);
    if (error && error.stack) {
      console.error('General error stack trace:', error.stack);
    }
    console.error('General error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
    });
    return NextResponse.json({
      error: 'Failed to create promocode',
      details: error?.message || String(error),
      sql: error?.sqlMessage || error?.sql || null,
      stack: error?.stack || null,
      full: error
    }, { status: 500 });
  }
}
