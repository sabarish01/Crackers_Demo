export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customer_id');
  const cartItemId = searchParams.get('id');
  if (!customerId && !cartItemId) {
    return new Response(JSON.stringify({ error: 'customer_id or id required' }), { status: 400 });
  }
  try {
    if (cartItemId) {
      await connection.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    } else if (customerId) {
      await connection.query('DELETE FROM cart_items WHERE customer_id = ?', [customerId]);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete cart item(s)', details: String(error) }), { status: 500 });
  }
}
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    const { quantity } = body;
    if (!id || typeof quantity !== 'number') {
      return new Response(JSON.stringify({ error: 'id and quantity are required' }), { status: 400 });
    }
    await connection.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [quantity, id]
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Update cart item error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update cart item', details: String(error) }), { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_id, product_id, quantity } = body;
    if (!customer_id || !product_id || !quantity) {
      return new Response(JSON.stringify({ error: 'customer_id, product_id, and quantity are required' }), { status: 400 });
    }

    // Get product stock
    const [productRows] = await connection.query(
      'SELECT stock_quantity FROM products WHERE id = ?',
      [product_id]
    );
    const product = (productRows as any[])[0];
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    // Check if item already exists in cart
    const [existingRows] = await connection.query(
      'SELECT * FROM cart_items WHERE customer_id = ? AND product_id = ?',
      [customer_id, product_id]
    );
    let newQuantity = quantity;
    if ((existingRows as any[]).length > 0) {
      const currentQuantity = (existingRows as any[])[0].quantity;
      newQuantity = Math.min(currentQuantity + quantity, product.stock_quantity);
      await connection.query(
        'UPDATE cart_items SET quantity = ? WHERE customer_id = ? AND product_id = ?',
        [newQuantity, customer_id, product_id]
      );
    } else {
      newQuantity = Math.min(quantity, product.stock_quantity);
      // Generate a UUID for the new cart item
      const uuid = crypto.randomUUID();
      await connection.query(
        'INSERT INTO cart_items (id, customer_id, product_id, quantity) VALUES (?, ?, ?, ?)',
        [uuid, customer_id, product_id, newQuantity]
      );
    }
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return new Response(JSON.stringify({ error: 'Failed to add item to cart', details: String(error) }), { status: 500 });
  }
}
import { NextRequest } from 'next/server';
import connection from '@/lib/mysql';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customer_id');
  if (!customerId) {
    return new Response(JSON.stringify({ error: 'Customer ID required' }), { status: 400 });
  }
  try {
    const [rows] = await connection.query(
      `SELECT ci.*, p.id as product_id, p.name, p.price, p.image_url, p.stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.customer_id = ?`,
      [customerId]
    );
    const items = (rows as any[]).map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      products: {
        id: row.product_id,
        name: row.name,
        price: row.price,
        image_url: row.image_url,
        stock_quantity: row.stock_quantity
      }
    }));
    return new Response(JSON.stringify(items), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to load cart' }), { status: 500 });
  }
}
