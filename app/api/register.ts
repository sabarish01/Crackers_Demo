import type { NextApiRequest, NextApiResponse } from 'next';
import connection from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check for duplicate phone or email
    const [existingRows] = await connection.query(
      'SELECT * FROM customers WHERE phone = ? OR email = ? LIMIT 1',
      [phone, email]
    );
    const existing = (existingRows as any[])[0];
    if (existing) {
      return res.status(409).json({ error: 'Phone or email already registered' });
    }
    // Create new customer
    const [result] = await connection.query(
      'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, email, phone, password]
    );
    // Fetch the newly created customer
    const [rows] = await connection.query(
      'SELECT * FROM customers WHERE id = ?',
      [(result as any).insertId]
    );
    const customer = (rows as any[])[0];
    if (customer) delete customer.password;
    return res.status(201).json({ customer });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}
