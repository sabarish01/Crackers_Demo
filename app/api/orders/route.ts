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
    courier_bill_image,
  status,
  items_modified,
  promo_code
    } = body;
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }
    // Only allow update if status is before 'Shipped'
    const [rowsRaw] = await connection.query(
  'SELECT status, delivery_name, delivery_email, delivery_phone, delivery_address, delivery_pincode, discount_amount, total_amount, final_amount, courier_partner, tracking_number, courier_bill_url, promo_code FROM orders WHERE id = ?',
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
      total_amount?: number;
      final_amount?: number;
      promo_code?: string | null;
    }[];
    const order = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const statusOrder = ['Pending', 'Accepted', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    const currentStatusIndex = statusOrder.indexOf(order.status);
    const shippedIndex = statusOrder.indexOf('Shipped');

    // Always allow status change to 'Cancelled' from any status except if already cancelled
    if (typeof status === 'string' && status === 'Cancelled' && order.status !== 'Cancelled') {
      await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
      return NextResponse.json({ success: true });
    }

    // Allow status change from 'Shipped' to 'Delivered'
    // Allow tracking/courier updates in Shipped, but block item changes and status revert
    if (currentStatusIndex > shippedIndex || (currentStatusIndex === shippedIndex && status !== 'Delivered')) {
      // Only allow tracking/courier updates in Shipped
      if (
        typeof courier_partner !== 'undefined' ||
        typeof tracking_number !== 'undefined' ||
        typeof courier_bill_image !== 'undefined'
      ) {
        // Allow only tracking/courier updates
        await connection.query(
          'UPDATE orders SET courier_partner = ?, tracking_number = ?, courier_bill_url = ? WHERE id = ?',
          [
            courier_partner ?? order.courier_partner,
            tracking_number ?? order.tracking_number,
            courier_bill_image ?? order.courier_bill_url,
            order_id
          ]
        );
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Cannot update after order is shipped (except to Delivered or Cancelled)' }, { status: 400 });
    }

    // Update status if provided and allowed
    if (typeof status === 'string' && statusOrder.includes(status)) {
      const newStatusIndex = statusOrder.indexOf(status);
      // Allow status change to 'Cancelled' from any status except if already cancelled
      if (status === 'Cancelled' && order.status !== 'Cancelled') {
        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
      } else if (newStatusIndex > currentStatusIndex && newStatusIndex <= statusOrder.indexOf('Delivered')) {
        // Only allow forward status changes (not reverting to previous status)
        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
      }
    }

    // Update delivery details and tracking info
    // Prevent null for NOT NULL columns
    const safe_delivery_address = delivery_address ?? order.delivery_address;
    const safe_delivery_pincode = delivery_pincode ?? order.delivery_pincode;
    // Always update delivery/tracking fields; do not touch discount here
    await connection.query(
      'UPDATE orders SET delivery_name = ?, delivery_email = ?, delivery_phone = ?, delivery_address = ?, delivery_pincode = ?, courier_partner = ?, tracking_number = ?, courier_bill_url = ?, promo_code = COALESCE(?, promo_code) WHERE id = ?',
      [
        delivery_name ?? order.delivery_name,
        delivery_email ?? order.delivery_email,
        delivery_phone ?? order.delivery_phone,
        safe_delivery_address,
        safe_delivery_pincode,
        courier_partner ?? order.courier_partner,
        tracking_number ?? order.tracking_number,
        courier_bill_image ?? order.courier_bill_url,
        typeof promo_code === 'string' ? promo_code : null,
        order_id
      ]
    );

    // Track whether items were changed and recalc totals
    let totalAmount: number | null = null;
    if (Array.isArray(items)) {
      // Remove all existing items and re-insert (for simplicity)
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [order_id]);
      for (const item of items) {
        await connection.query(
          'INSERT INTO order_items (id, order_id, product_id, quantity, price, is_modified, is_new) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.id, order_id, item.product_id, item.quantity, item.price, item.isModified ? 1 : 0, item.isNew ? 1 : 0]
        );
      }
      // Recalculate totals from provided items
      totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0);
    }

    // Recalculate or update totals based on provided payload
    if (Array.isArray(items)) {
      // Items provided: recalc subtotal and discount using promocode if present and valid
      let discountToUse = 0;
      const subtotalNow = Number(totalAmount || 0);
      if (order.promo_code) {
        const today = new Date().toISOString().split('T')[0];
        const [promoRows] = await connection.query(
          'SELECT discount_percentage, min_order_value, is_active, expiry_date FROM promocodes WHERE code = ? AND is_active = 1 AND expiry_date >= ? LIMIT 1',
          [String(order.promo_code).toUpperCase(), today]
        );
        const promo = (promoRows as any[])[0];
        if (promo && subtotalNow >= Number(promo.min_order_value || 0)) {
          const pct = Number(promo.discount_percentage || 0);
          discountToUse = Math.floor((subtotalNow * pct) / 100);
        }
      }
      // If no promo or invalid, discount remains 0
      const finalAmount = Math.max(subtotalNow - Number(discountToUse || 0), 0);
      try {
        await connection.query(
          'UPDATE orders SET total_amount = ?, discount_amount = ?, final_amount = ?, items_modified = COALESCE(?, items_modified) WHERE id = ?',
          [Number(subtotalNow), Number(discountToUse), Number(finalAmount), typeof items_modified === 'boolean' ? (items_modified ? 1 : 0) : null, order_id]
        );
      } catch (e: any) {
        if (e && (e.code === 'ER_BAD_FIELD_ERROR' || e.errno === 1054)) {
          await connection.query(
            'UPDATE orders SET total_amount = ?, discount_amount = ?, final_amount = ? WHERE id = ?',
            [Number(subtotalNow), Number(discountToUse), Number(finalAmount), order_id]
          );
        } else {
          throw e;
        }
      }
    } else if (typeof promo_code === 'string') {
      // Promo changed without item edits: recompute discount on current subtotal
      const subtotal = Number(order.total_amount ?? 0);
      let discountToUse = 0;
      if (promo_code) {
        const today = new Date().toISOString().split('T')[0];
        const [promoRows] = await connection.query(
          'SELECT discount_percentage, min_order_value, is_active, expiry_date FROM promocodes WHERE code = ? AND is_active = 1 AND expiry_date >= ? LIMIT 1',
          [promo_code.toUpperCase(), today]
        );
        const promo = (promoRows as any[])[0];
        if (promo && subtotal >= Number(promo.min_order_value || 0)) {
          const pct = Number(promo.discount_percentage || 0);
          discountToUse = Math.floor((subtotal * pct) / 100);
        }
      }
      const finalAmount = Math.max(subtotal - discountToUse, 0);
      await connection.query(
        'UPDATE orders SET discount_amount = ?, final_amount = ? WHERE id = ?',
        [discountToUse, finalAmount, order_id]
      );
    } else if (typeof discount_amount === 'number') {
      // Only discount provided: update discount and recompute final from existing subtotal
      const subtotal = Number(order.total_amount ?? 0);
      const discountToUse = Number(discount_amount);
      const finalAmount = Math.max(subtotal - discountToUse, 0);
      await connection.query(
        'UPDATE orders SET discount_amount = ?, final_amount = ? WHERE id = ?',
        [discountToUse, finalAmount, order_id]
      );
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
        'INSERT INTO order_items (id, order_id, product_id, quantity, price, is_modified, is_new) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderItemId, orderId, item.product_id, item.quantity, item.price, item.isModified ? 1 : 0, item.isNew ? 1 : 0]
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

    let ordersQuery = `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
      o.payment_screenshot_url, o.bank_reference_number
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
        `SELECT oi.*, p.id as product_id, p.name, p.image_url, p.stock_quantity, oi.is_modified, oi.is_new
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
        isModified: !!item.is_modified,
        isNew: !!item.is_new,
        products: {
          id: item.product_id,
          name: item.name,
          image_url: item.image_url,
          stock_quantity: item.stock_quantity
        }
      });
    }
    // Attach items to orders, include courier and notification fields
    const ordersWithItems = (orders as any[]).map((order: any) => {
      const items = itemsByOrderId[order.id] || [];
      const computedSubtotal = items.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0);
      const subtotalRaw = Number(order.total_amount);
      const discountRaw = Number(order.discount_amount);
      const finalRaw = Number(order.final_amount);
      const subtotal = Number.isFinite(subtotalRaw) && subtotalRaw > 0 ? subtotalRaw : computedSubtotal;
      const discount = Number.isFinite(discountRaw) ? discountRaw : 0;
      const final = Number.isFinite(finalRaw) && finalRaw >= 0 ? finalRaw : Math.max(subtotal - discount, 0);

      return {
        ...order,
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: final,
        customers: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone
        },
        order_items: items,
        courier_partner: order.courier_partner,
        tracking_number: order.tracking_number,
        courier_bill_url: order.courier_bill_url,
        payment_screenshot_url: order.payment_screenshot_url,
        bank_reference_number: order.bank_reference_number,
        items_modified: order.items_modified === 1
      };
    });
    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders', details: String(error) }, { status: 500 });
  }
}
