import type { NextApiRequest, NextApiResponse } from 'next';
import connection from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Phone and password are required' });
  }

  try {
    const [rows] = await connection.query(
      'SELECT * FROM customers WHERE phone = ? LIMIT 1',
      [phone]
    );
    const customer = (rows as any[])[0];
    if (!customer) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }
    if (customer.password !== password) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }
    // Remove password before sending to client
    delete customer.password;
    return res.status(200).json({ customer });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
}
