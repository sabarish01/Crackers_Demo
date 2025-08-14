
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';
import connection from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request:', req.method, req.body);
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, password } = req.body;
  console.log('Received registration form values:', { name, email, phone, password });
  if (!name || !email || !phone || !password) {
    console.log('Missing fields:', { name, email, phone, password });
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check for duplicate phone or email
    console.log('Checking for existing customer:', phone, email);
    const [existingRows] = await connection.query(
      'SELECT * FROM customers WHERE phone = ? OR email = ? LIMIT 1',
      [phone, email]
    );
    const existing = (existingRows as any[])[0];
    if (existing) {
      console.log('Duplicate found:', existing);
      return res.status(409).json({ error: 'Phone or email already registered' });
    }
    // Create new customer with UUID
    const id = uuidv4();
    console.log('Inserting new customer:', { id, name, email, phone });
    const [result] = await connection.query(
      'INSERT INTO customers (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, phone, password]
    );
    console.log('Insert result:', result);
    // Fetch the newly created customer
    const [rows] = await connection.query(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );
    const customer = (rows as any[])[0];
    if (customer) delete customer.password;
    console.log('New customer created:', customer);
    return res.status(201).json({ customer });
  } catch (error) {
    let errorMsg = '';
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    } else {
      errorMsg = JSON.stringify(error);
    }
    console.error('Registration error:', errorMsg, error);
    return res.status(500).json({ error: 'Registration failed', details: errorMsg });
  }
}
