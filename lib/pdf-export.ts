"use client"

import { formatCurrency, formatDate } from './utils'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: {
    name: string
    image_url?: string
  }
}

interface Order {
    id: string;
    total_amount: number;
    discount_amount: number;
    final_amount: number;
    status: string;
    delivery_address: string;
    delivery_pincode: string;
    payment_screenshot_url: string | null;
    bank_reference_number: string | null;
    courier_partner: string | null;
    tracking_number: string | null;
    courier_bill_url: string | null;
    created_at: string;
    promocode_id: string | null;
    delivery_name?: string;
    delivery_email?: string;
    delivery_phone?: string;
    promocodes?: {
        code: string;
        discount_percentage: number;
    };
    order_items: OrderItem[];
    items_modified?: boolean;
}

export const generateOrderPDF = (order: Order) => {
    // Create a new window for the PDF content
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
        alert('Please allow popups to generate PDF')
        return
    }

    // Payment details section (with image) - Card styled
    let paymentDetailsSection = '';
    if (order.payment_screenshot_url || order.bank_reference_number) {
        paymentDetailsSection = `
            <div class="card">
              <div class="section-title">Payment Details</div>
              <div class="info-row"><span class="info-label">Reference:</span> ${order.bank_reference_number || 'N/A'}</div>
              ${order.payment_screenshot_url ? `<div class="info-row"><img src="${order.payment_screenshot_url}" alt="Payment Screenshot" class="img" /></div>` : ''}
            </div>
        `;
    }

    // Add shipping details section to PDF
    let shippingDetailsSection = '';
    if (order.courier_partner || order.tracking_number || order.courier_bill_url) {
        shippingDetailsSection = `
            <div class="card">
              <div class="section-title">Shipping Details</div>
              ${order.courier_partner ? `<div class="info-row"><span class="info-label">Courier:</span> ${order.courier_partner}</div>` : ''}
              ${order.tracking_number ? `<div class="info-row"><span class="info-label">Tracking Number:</span> ${order.tracking_number}</div>` : ''}
              ${order.courier_bill_url ? `<div class="info-row"><img src="${order.courier_bill_url}" alt="Courier Bill" class="img small" /></div>` : ''}
            </div>
        `;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Order #${order.id.slice(-8)} - CrackersHub</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #ea580c;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #ea580c;
                margin-bottom: 5px;
            }
            .company-tagline {
                color: #666;
                font-size: 14px;
            }
            .order-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                gap: 20px;
            }
            .card {
                background: #f8f9fa;
                padding: 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                margin-bottom: 16px;
            }
            .img { max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid #ddd; margin-top: 8px; }
            .img.small { max-width: 120px; max-height: 120px; }
            .section-title { font-weight: 700; color: #ea580c; margin-bottom: 10px; border-bottom: 1px solid #ea580c; padding-bottom: 5px; }
            .info-row {
                margin-bottom: 8px;
            }
            .info-label {
                font-weight: bold;
                display: inline-block;
                width: 120px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-accepted { background: #dbeafe; color: #1e40af; }
            .status-paid { background: #d1fae5; color: #065f46; }
            .status-packed { background: #e9d5ff; color: #7c2d12; }
            .status-shipped { background: #c7d2fe; color: #3730a3; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 30px 0;
            }
            .items-table th,
            .items-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .items-table th {
                background: #ea580c;
                color: white;
                font-weight: bold;
            }
            .items-table tr:nth-child(even) {
                background: #f8f9fa;
            }
            .summary-section {
                margin-top: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 5px 0;
            }
            .summary-total {
                border-top: 2px solid #ea580c;
                padding-top: 10px;
                font-size: 18px;
                font-weight: bold;
                color: #ea580c;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
            }
            @media print {
                body { margin: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">🎆 CrackersHub</div>
            <div class="company-tagline">Premium Quality Crackers & Fireworks</div>
        </div>

        <div class="order-info">
            <div class="order-details card">
                <div class="section-title">Order Information</div>
                <div class="info-row">
                    <span class="info-label">Order ID:</span>
                    #${order.id.slice(-8)}
                </div>
                <div class="info-row">
                    <span class="info-label">Order Date:</span>
                    ${formatDate(order.created_at)}
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                ${order.tracking_number ? `
                <div class="info-row">
                    <span class="info-label">Tracking:</span>
                    ${order.tracking_number}
                </div>
                ` : ''}
            </div>
            
            <div class="customer-details card">
                <div class="section-title">Delivery Information</div>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    ${order.delivery_name || 'N/A'}
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    ${order.delivery_email || 'N/A'}
                </div>
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    ${order.delivery_phone || 'N/A'}
                </div>
                <div class="info-row">
                    <span class="info-label">Address:</span>
                    ${order.delivery_address || 'N/A'}
                </div>
                <div class="info-row">
                    <span class="info-label">Pincode:</span>
                    ${order.delivery_pincode || 'N/A'}
                </div>
            </div>
        </div>

                <div class="card">
                    <div class="section-title">Order Items</div>
                    <table class="items-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.order_items.map(item => `
                    <tr>
                        <td>${item.products.name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                `).join('')}
            </tbody>
                    </table>
                </div>

                <div class="summary-section card">
                    <div class="section-title">Order Summary</div>
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(order.total_amount)}</span>
            </div>
            ${order.discount_amount > 0 ? `
            <div class="summary-row" style="color: #059669;">
                <span>Discount:</span>
                <span>-${formatCurrency(order.discount_amount)}</span>
            </div>
            ` : ''}
            <div class="summary-row summary-total">
                        <span>Total Amount:</span>
                <span>${formatCurrency(order.final_amount)}</span>
            </div>
        </div>

    ${paymentDetailsSection}
    ${shippingDetailsSection}

        <div class="footer">
            <p><strong>CrackersHub</strong> - Your trusted partner for premium quality crackers and fireworks</p>
            <p>📞 +91 98765 43210 | 📧 info@crackershub.com | 📍 Sivakasi, Tamil Nadu, India</p>
            <p>Thank you for choosing CrackersHub! 🎆</p>
        </div>

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

export const generateCustomerReportPDF = (customers: any[]) => {
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    alert('Please allow popups to generate PDF')
    return
  }

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.total_orders > 0).length
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Customer Report - CrackersHub</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #ea580c;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .company-name {
                font-size: 28px;
                font-weight: bold;
                color: #ea580c;
                margin-bottom: 5px;
            }
            .report-title {
                font-size: 20px;
                color: #666;
                margin-top: 10px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border-left: 4px solid #ea580c;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #ea580c;
            }
            .stat-label {
                color: #666;
                font-size: 14px;
            }
            .customers-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .customers-table th,
            .customers-table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
                font-size: 12px;
            }
            .customers-table th {
                background: #ea580c;
                color: white;
                font-weight: bold;
            }
            .customers-table tr:nth-child(even) {
                background: #f8f9fa;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">🎆 CrackersHub</div>
            <div class="report-title">Customer Report - ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalCustomers}</div>
                <div class="stat-label">Total Customers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${activeCustomers}</div>
                <div class="stat-label">Active Customers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${formatCurrency(totalRevenue)}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
        </div>

        <table class="customers-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Joined</th>
                </tr>
            </thead>
            <tbody>
                ${customers.map(customer => `
                    <tr>
                        <td>${customer.name}</td>
                        <td>${customer.email}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.total_orders || 0}</td>
                        <td>${formatCurrency(customer.total_spent || 0)}</td>
                        <td>${formatDate(customer.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="footer">
            <p><strong>CrackersHub Admin Panel</strong> - Generated on ${new Date().toLocaleString()}</p>
        </div>

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
