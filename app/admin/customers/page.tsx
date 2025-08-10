"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
// Removed direct MySQL connection; all data access via API endpoints
import { formatCurrency } from '@/lib/utils'
import AdminLayout from '@/components/admin/admin-layout'
import { Users, Search, FileText, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  pincode: string
  created_at: string
  total_orders?: number
  total_spent?: number
  last_order_date?: string
}

interface CustomerOrder {
  id: string
  total_amount: number
  final_amount: number
  discount_amount?: number
  status: string
  created_at: string
  order_items: {
    id: string
    quantity: number
    price: number
    products: {
      name: string
    }
  }[]
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const { toast } = useToast()

  // Export customer report as PDF using the order PDF's color/style, but with customer summary content
  const exportCustomerReport = async (customer: Customer) => {
    if (!customerOrders.length) {
      window.alert('No orders found for this customer.');
      return;
    }
    // Calculate total spent for this customer
  let totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.final_amount) || 0), 0);
  if (isNaN(totalSpent) || !isFinite(totalSpent)) totalSpent = 0;
    // Compose HTML using the order PDF's style
    const { formatDate } = await import('@/lib/utils');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Report - ${customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; color: #ea580c; margin-bottom: 5px; }
          .company-tagline { color: #666; font-size: 14px; }
          .section-title { font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 10px; border-bottom: 1px solid #ea580c; padding-bottom: 5px; }
          .info-row { margin-bottom: 8px; }
          .info-label { font-weight: bold; display: inline-block; width: 120px; }
          .summary-section { margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; }
          .summary-total { border-top: 2px solid #ea580c; padding-top: 10px; font-size: 18px; font-weight: bold; color: #ea580c; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background: #ea580c; color: white; font-weight: bold; }
          .items-table tr:nth-child(even) { background: #f8f9fa; }
          .footer { margin-top: 50px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">🎆 CrackersHub</div>
          <div class="company-tagline">Premium Quality Crackers & Fireworks</div>
        </div>
        <div class="section-title">Customer Information</div>
        <div class="info-row"><span class="info-label">Name:</span> ${customer.name}</div>
        <div class="info-row"><span class="info-label">Email:</span> ${customer.email}</div>
        <div class="info-row"><span class="info-label">Phone:</span> ${customer.phone}</div>
        <div class="info-row"><span class="info-label">Address:</span> ${customer.address}</div>
        <div class="info-row"><span class="info-label">Pincode:</span> ${customer.pincode}</div>
        <div class="info-row"><span class="info-label">Member Since:</span> ${formatDate ? formatDate(customer.created_at) : new Date(customer.created_at).toLocaleDateString()}</div>
        <div class="summary-section">
          <div class="section-title">Order Statistics</div>
          <div class="summary-row"><span>Total Orders:</span><span>${customer.total_orders || customerOrders.length}</span></div>
          <div class="summary-row"><span>Total Spent:</span><span>${formatCurrency(totalSpent)}</span></div>
          <div class="summary-row"><span>Last Order:</span><span>${customer.last_order_date ? (formatDate ? formatDate(customer.last_order_date) : new Date(customer.last_order_date).toLocaleDateString()) : 'Never'}</span></div>
        </div>
        <div class="summary-section">
          <div class="section-title">Order History</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Status</th>
                <th>Products</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${customerOrders.map(order => `
                <tr>
                  <td>${order.id.slice(-8)}</td>
                  <td>${formatDate ? formatDate(order.created_at) : new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${order.status}</td>
                  <td>
                    ${order.order_items.map(item => `${item.products.name} × ${item.quantity}`).join('<br/>')}
                  </td>
                  <td>${formatCurrency(order.final_amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="footer">
          <p><strong>CrackersHub</strong> - Your trusted partner for premium quality crackers and fireworks</p>
          <p>📞 +91 98765 43210 | 📧 info@crackershub.com | 📍 Sivakasi, Tamil Nadu, India</p>
          <p>Thank you for choosing CrackersHub! 🎆</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?sort=created_at_desc')
      if (!res.ok) {
        throw new Error('Failed to load customers')
      }
      const customers: Customer[] = await res.json()
      // Only fetch order statistics summary (not order items) for each customer
      const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
          const ordersRes = await fetch(`/api/orders?customer_id=${customer.id}&sort=created_at_desc`)
          const orders: { final_amount: number; created_at: string }[] = ordersRes.ok ? await ordersRes.json() : []
          const totalOrders = orders.length
          const totalSpent = orders.reduce((sum, order) => sum + (Number(order.final_amount) || 0), 0)
          const lastOrderDate = orders[0]?.created_at ?? undefined
          return {
            ...customer,
            total_orders: totalOrders,
            total_spent: isNaN(totalSpent) || !isFinite(totalSpent) ? 0 : totalSpent,
            last_order_date: lastOrderDate
          }
        })
      )
      setCustomers(customersWithStats)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerOrders = async (customerId: string) => {
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/orders?customer_id=${customerId}&sort=created_at_desc`)
      if (!res.ok) {
        throw new Error('Failed to load customer orders')
      }
      const orders: any[] = await res.json()
      // For each order, fetch order_items and product name
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const itemsRes = await fetch(`/api/order-items?order_id=${order.id}`)
          const items: any[] = itemsRes.ok ? await itemsRes.json() : []
          return {
            ...order,
            discount_amount: order.discount_amount ?? 0,
            order_items: items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              products: { name: item.name } // Fix: use item.name from API
            }))
          }
        })
      )
      setCustomerOrders(ordersWithItems)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customer orders",
        variant: "destructive",
      })
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    fetchCustomerOrders(customer.id)
  // Export customer report as printable HTML
  const exportCustomerReport = (customer: Customer) => {
    const reportContent = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ea580c; margin-bottom: 10px;">CrackersHub</h1>
        <h2 style="color: #333; margin-bottom: 20px;">Customer Report</h2>
        <p style="color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px;">Customer Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div><strong>Name:</strong> ${customer.name}</div>
          <div><strong>Email:</strong> ${customer.email}</div>
          <div><strong>Phone:</strong> ${customer.phone}</div>
          <div><strong>Address:</strong> ${customer.address}</div>
          <div><strong>Pincode:</strong> ${customer.pincode}</div>
          <div><strong>Member Since:</strong> ${new Date(customer.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #333; margin-bottom: 15px;">Order Statistics</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div><strong>Total Orders:</strong> ${customer.total_orders || 0}</div>
          <div><strong>Total Spent:</strong> ${formatCurrency(customer.total_spent || 0)}</div>
          <div><strong>Last Order:</strong> ${customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'Never'}</div>
        </div>
      </div>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Customer Report - ${customer.name}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${reportContent}
            <script>
              window.onload = function() {
                window.print();
              }
            <\/script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  if (loading) {
    return (
      <AdminLayout title="Customer Management">
        <div className="text-center">Loading customers...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Customer Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {customer.total_orders || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(
                          selectedCustomer && selectedCustomer.id === customer.id && customerOrders.length > 0
                            ? (() => {
                                let sum = customerOrders.reduce((s, o) => s + (Number(o.final_amount) || 0), 0);
                                return isNaN(sum) || !isFinite(sum) ? 0 : sum;
                              })()
                            : (typeof customer.total_spent === 'number' && isFinite(customer.total_spent) ? customer.total_spent : 0)
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.last_order_date 
                          ? new Date(customer.last_order_date).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewCustomer(customer)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Customer Details - {selectedCustomer?.name}</DialogTitle>
                              </DialogHeader>
                              {selectedCustomer && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Contact Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                        <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                                        <p><strong>Address:</strong> {selectedCustomer.address}</p>
                                        <p><strong>Pincode:</strong> {selectedCustomer.pincode}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Statistics</h4>
                                      <div className="space-y-1 text-sm">
                                        <p><strong>Total Orders:</strong> {selectedCustomer.total_orders || 0}</p>
                                        <p><strong>Total Spent:</strong> {formatCurrency(isNaN(Number(selectedCustomer.total_spent)) || !isFinite(Number(selectedCustomer.total_spent)) ? 0 : Number(selectedCustomer.total_spent))}</p>
                                        <p><strong>Member Since:</strong> {new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Order History</h4>
                                    {loadingOrders ? (
                                      <p>Loading orders...</p>
                                    ) : customerOrders.length > 0 ? (
                                      <div className="space-y-2">
                                        {customerOrders.map((order) => (
                                          <div key={order.id} className="border rounded p-3">
                                            <div className="flex justify-between items-start mb-2">
                                              <div>
                                                <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                                <p className="text-sm text-gray-600">
                                                  {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-medium">{formatCurrency(order.final_amount)}</p>
                                                <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>
                                                  {order.status}
                                                </Badge>
                                              </div>
                                            </div>
                                            <div className="text-sm overflow-x-auto">
                                              <table className="w-full text-xs border border-gray-200 mb-2">
                                                <thead>
                                                  <tr className="bg-gray-50">
                                                    <th className="border px-2 py-1">Product</th>
                                                    <th className="border px-2 py-1">Qty</th>
                                                    <th className="border px-2 py-1">Price</th>
                                                    <th className="border px-2 py-1">Subtotal</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {order.order_items.map((item) => (
                                                    <tr key={item.id}>
                                                      <td className="border px-2 py-1">{item.products.name}</td>
                                                      <td className="border px-2 py-1 text-center">{item.quantity}</td>
                                                      <td className="border px-2 py-1 text-right">{formatCurrency(item.price)}</td>
                                                      <td className="border px-2 py-1 text-right">{formatCurrency(item.price * item.quantity)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                              <div className="text-right text-xs font-semibold">
                                                <span>Order Discount: {order.discount_amount ? formatCurrency(order.discount_amount) : '0'}</span><br />
                                                Order Total: {formatCurrency(order.final_amount)}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-600">No orders found</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportCustomerReport(customer)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
