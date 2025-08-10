export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_id,
      delivery_name,
      delivery_email,
      delivery_phone,
      delivery_address,
      delivery_pincode,
      items,
      discount_amount,
      courier_partner,
      tracking_number,
      courier_bill_image
    } = body;
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }
    // Only allow update if status is before 'Shipped'
    const [rowsRaw] = await connection.query(
      'SELECT status, delivery_name, delivery_email, delivery_phone, delivery_address, delivery_pincode, discount_amount, courier_partner, tracking_number, courier_bill_url FROM orders WHERE id = ?',
      [order_id]
    );
    const rows = rowsRaw as {
      status: string;
      delivery_name?: string;
      delivery_email?: string;
      delivery_phone?: string;
      delivery_address?: string;
      delivery_pincode?: string;
      discount_amount?: number;
      courier_partner?: string;
      tracking_number?: string;
      courier_bill_url?: string;
    }[];
    const order = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const statusOrder = ['Pending', 'Accepted', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const shippedIndex = statusOrder.indexOf('Shipped');
    if (currentStatusIndex >= shippedIndex) {
      return NextResponse.json({ error: 'Cannot update after order is shipped' }, { status: 400 });
    }

    // Update delivery details and tracking info
    // Prevent null for NOT NULL columns
    const safe_delivery_address = delivery_address ?? order.delivery_address;
    const safe_delivery_pincode = delivery_pincode ?? order.delivery_pincode;
    await connection.query(
      'UPDATE orders SET delivery_name = ?, delivery_email = ?, delivery_phone = ?, delivery_address = ?, delivery_pincode = ?, discount_amount = ?, courier_partner = ?, tracking_number = ?, courier_bill_url = ? WHERE id = ?',
      [
        delivery_name ?? order.delivery_name,
        delivery_email ?? order.delivery_email,
        delivery_phone ?? order.delivery_phone,
        safe_delivery_address,
        safe_delivery_pincode,
        discount_amount ?? order.discount_amount ?? 0,
        courier_partner ?? order.courier_partner,
        tracking_number ?? order.tracking_number,
        courier_bill_image ?? order.courier_bill_url,
        order_id
      ]
    );

    // If items are provided, update order items and set items_modified flag
    if (Array.isArray(items)) {
      // Remove all existing items and re-insert (for simplicity)
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [order_id]);
      for (const item of items) {
        await connection.query(
          'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [item.id, order_id, item.product_id, item.quantity, item.price]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order', details: String(error) }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
  const { customer_id, delivery_address, delivery_pincode, items, promo_code, delivery_name, delivery_phone, delivery_email, discount_amount, final_amount } = body;
    if (!customer_id || !delivery_address || !delivery_pincode || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a custom order number: YYYYNNNN
    const now = new Date();
    const year = now.getFullYear();
    // Get the latest order for this year
    const [latestOrderRowsRaw] = await connection.query(
      'SELECT id FROM orders WHERE id LIKE ? ORDER BY id DESC LIMIT 1',
      [`${year}%`]
    );
    const latestOrderRows = latestOrderRowsRaw as { id: string }[];
    let nextNumber = 1;
    if (Array.isArray(latestOrderRows) && latestOrderRows.length > 0 && latestOrderRows[0].id) {
      const lastId = latestOrderRows[0].id;
      const lastSeq = parseInt(lastId.slice(4), 10);
      if (!isNaN(lastSeq)) nextNumber = lastSeq + 1;
    }
    const orderId = `${year}${String(nextNumber).padStart(4, '0')}`;
    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Use discount_amount and final_amount from request if provided, else fallback
    const discount = typeof discount_amount === 'number' ? discount_amount : 0;
    const final = typeof final_amount === 'number' ? final_amount : (total_amount - discount);
    // Insert order (include all required fields)
    await connection.query(
      'INSERT INTO orders (id, customer_id, delivery_address, delivery_pincode, promo_code, total_amount, discount_amount, final_amount, delivery_name, delivery_phone, delivery_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, customer_id, delivery_address, delivery_pincode, promo_code || null, total_amount, discount, final, delivery_name || null, delivery_phone || null, delivery_email || null]
    );

    // Insert order items
    for (const item of items) {
      const orderItemId = crypto.randomUUID();
      await connection.query(
        'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderItemId, orderId, item.product_id, item.quantity, item.price]
      );
      // Reduce stock for the product
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
    }

  return NextResponse.json({ success: true, order_id: orderId }, { status: 201 });
  } catch (error) {
    console.error('Order placement error:', error);
    return NextResponse.json({ error: 'Failed to place order', details: String(error) }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import connection from '@/lib/mysql';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer_id = searchParams.get('customer_id');

    let ordersQuery = `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id`;
    let queryParams: any[] = [];

    if (customer_id) {
      ordersQuery += ' WHERE o.customer_id = ?';
      queryParams.push(customer_id);
    }
    ordersQuery += ' ORDER BY o.created_at DESC';

    const [orders] = await connection.query(ordersQuery, queryParams);
    const orderIds = (orders as any[]).map((order: any) => order.id);
    let orderItems: any[] = [];
    if (orderIds.length > 0) {
      const [itemsRows] = await connection.query(
        `SELECT oi.*, p.id as product_id, p.name, p.image_url, p.stock_quantity
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id IN (${orderIds.map(() => '?').join(',')})`,
        orderIds
      );
      orderItems = itemsRows as any[];
    }
    // Group items by order_id
    const itemsByOrderId: Record<string, any[]> = {};
    for (const item of orderItems) {
      if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
      itemsByOrderId[item.order_id].push({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        products: {
          id: item.product_id,
          name: item.name,
          image_url: item.image_url,
          stock_quantity: item.stock_quantity
        }
      });
    }
    // Attach items to orders, include courier and notification fields
    const ordersWithItems = (orders as any[]).map((order: any) => ({
      ...order,
      customers: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone
      },
      order_items: itemsByOrderId[order.id] || [],
      courier_partner: order.courier_partner,
      tracking_number: order.tracking_number,
      courier_bill_url: order.courier_bill_url,
      items_modified: order.items_modified === 1
    }));
    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders', details: String(error) }, { status: 500 });
  }
}
