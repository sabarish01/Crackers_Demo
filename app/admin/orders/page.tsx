"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import AdminLayout from '@/components/admin/admin-layout'
import { Package, Search, FileText, Edit, Trash2, Plus, Minus } from 'lucide-react'

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products: {
    id: string
    name: string
    image_url: string
    stock_quantity: number
  }
  isModified?: boolean
  isNew?: boolean
}

interface Order {
  id: string
  customer_id: string
  total_amount: number
  discount_amount: number
  final_amount: number
  delivery_address: string
  delivery_pincode: string
  status: string
  created_at: string
  customers: {
    name: string
    email: string
    phone: string
  }
  order_items: OrderItem[]
}

interface Product {
  id: string
  name: string
  price: number
  stock_quantity: number
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingItems, setEditingItems] = useState<OrderItem[]>([])
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1
  })
  // Track Details state
  const [courierPartner, setCourierPartner] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierBillFile, setCourierBillFile] = useState<File | null>(null)
  const [courierBillPreview, setCourierBillPreview] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to load orders')
      if (!res.ok) {
        throw new Error('Failed to load orders')
      }
      const orders = await res.json()
      setOrders(orders)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to load products')
      const products = await res.json()
      setProducts(products)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update order status')
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setEditingItems([...order.order_items])
    setNewItem({ product_id: '', quantity: 1 })
    // Reset and prefill track details if available (backend integration needed)
    setCourierPartner('')
    setTrackingNumber('')
    setCourierBillFile(null)
    setCourierBillPreview(null)
  }

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setEditingItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, isModified: true }
        : item
    ))
  }

  const removeItem = (itemId: string) => {
    setEditingItems(prev => prev.filter(item => item.id !== itemId))
  }

  const addNewItem = () => {
    if (!newItem.product_id) return

    const product = products.find(p => p.id === newItem.product_id)
    if (!product) return

    const newOrderItem: OrderItem = {
      id: `new_${Date.now()}`,
      order_id: selectedOrder!.id,
      product_id: newItem.product_id,
      quantity: newItem.quantity,
      price: product.price,
      products: {
        id: product.id,
        name: product.name,
        image_url: '/placeholder.svg',
        stock_quantity: product.stock_quantity
      },
      isNew: true
    }

    setEditingItems(prev => [...prev, newOrderItem])
    setNewItem({ product_id: '', quantity: 1 })
  }

  const saveOrderChanges = async () => {
    if (!selectedOrder) return

    try {
      let courierBillImageUrl = ''
      // Upload courier bill image if present
      if (courierBillFile) {
        const fd = new FormData();
        fd.append('file', courierBillFile);
        fd.append('order_id', selectedOrder.id);
        const uploadRes = await fetch('/api/upload-courier-image', {
          method: 'POST',
          body: fd
        });
        if (!uploadRes.ok) throw new Error('Failed to upload courier bill image');
        const data = await uploadRes.json();
        courierBillImageUrl = data.path || data.imageUrl;
      }

      // Call API to update order items, totals, and track details
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          items: editingItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            isNew: item.isNew,
            isModified: item.isModified
          })),
          discount_amount: selectedOrder.discount_amount,
          courier_partner: courierPartner,
          tracking_number: trackingNumber,
          courier_bill_image: courierBillImageUrl
        })
      })
      if (!response.ok) throw new Error('Failed to update order')
      toast({
        title: "Success",
        description: "Order updated successfully",
      })
      fetchOrders()
      setSelectedOrder(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      })
    }
  }

  const exportOrderPDF = (order: Order) => {
    const orderContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ea580c; margin-bottom: 10px;">CrackersHub</h1>
          <h2 style="color: #333; margin-bottom: 20px;">Order Invoice</h2>
          <p style="color: #666;">Order #${order.id.slice(-8)} - ${new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #333; margin-bottom: 15px;">Customer Details</h3>
            <p><strong>Name:</strong> ${order.customers.name}</p>
            <p><strong>Email:</strong> ${order.customers.email}</p>
            <p><strong>Phone:</strong> ${order.customers.phone}</p>
            <p><strong>Address:</strong> ${order.delivery_address}</p>
            <p><strong>Pincode:</strong> ${order.delivery_pincode}</p>
          </div>
          <div>
            <h3 style="color: #333; margin-bottom: 15px;">Order Details</h3>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ${formatCurrency(order.final_amount)}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; margin-bottom: 15px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Product</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">Quantity</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">Price</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.order_items.map(item => `
                <tr style="${item.isModified ? 'background: #fff3cd;' : item.isNew ? 'background: #d1e7dd;' : ''}">
                  <td style="padding: 12px; border: 1px solid #dee2e6;">
                    ${item.products.name}
                    ${item.isModified ? '<span style="color: #856404; font-size: 12px;"> (Modified)</span>' : ''}
                    ${item.isNew ? '<span style="color: #0f5132; font-size: 12px;"> (New Item)</span>' : ''}
                  </td>
                  <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">${formatCurrency(item.price)}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="text-align: right; margin-top: 20px;">
          <p style="font-size: 18px; font-weight: bold; color: #ea580c;">
            Total: ${formatCurrency(order.final_amount)}
          </p>
        </div>
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order Invoice - ${order.id.slice(-8)}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${orderContent}
            <script>
              window.onload = function() {
                window.print();
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customers.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <AdminLayout title="Orders Management">
        <div className="text-center">Loading orders...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Orders Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">
                        #{order.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customers.name}</p>
                          <p className="text-sm text-gray-600">{order.customers.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {order.order_items.slice(0, 3).map((item, index) => (
                            <Image
                              key={index}
                              src={item.products.image_url || "/placeholder.svg"}
                              alt={item.products.name}
                              width={32}
                              height={32}
                              className="rounded-full border-2 border-white"
                            />
                          ))}
                          {order.order_items.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                              +{order.order_items.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.final_amount)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusUpdate(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Accepted">Accepted</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.status === 'Pending' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditOrder(order)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Edit Order #{order.id.slice(-8)}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6">
                                  {/* Order Items (edit only before Shipped) */}
                                  <div>
                                    <h4 className="font-semibold mb-4">Order Items</h4>
                                    <div className="space-y-2">
                                      {editingItems.map((item) => (
                                        <div 
                                          key={item.id} 
                                          className={`flex items-center gap-4 p-3 border rounded ${
                                            item.isModified ? 'bg-orange-50 border-orange-200' : 
                                            item.isNew ? 'bg-green-50 border-green-200' : 'bg-white'
                                          }`}
                                        >
                                          <Image
                                            src={item.products.image_url || "/placeholder.svg"}
                                            alt={item.products.name}
                                            width={50}
                                            height={50}
                                            className="rounded object-cover"
                                          />
                                          <div className="flex-1">
                                            <p className="font-medium">{item.products.name}</p>
                                            <p className="text-sm text-gray-600">
                                              {formatCurrency(item.price)} each
                                            </p>
                                            {item.isModified && (
                                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                Modified
                                              </Badge>
                                            )}
                                            {item.isNew && (
                                              <Badge variant="outline" className="text-green-600 border-green-200">
                                                New Item
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                              disabled={item.quantity <= 1 || selectedOrder?.status === 'Shipped' || selectedOrder?.status === 'Delivered'}
                                            >
                                              <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="w-12 text-center font-medium">
                                              {item.quantity}
                                            </span>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                              disabled={item.quantity >= item.products.stock_quantity || selectedOrder?.status === 'Shipped' || selectedOrder?.status === 'Delivered'}
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-semibold">
                                              {formatCurrency(item.price * item.quantity)}
                                            </p>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeItem(item.id)}
                                              className="text-red-600 hover:text-red-700"
                                              disabled={selectedOrder?.status === 'Shipped' || selectedOrder?.status === 'Delivered'}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Add New Item (only before Shipped) */}
                                  {selectedOrder?.status !== 'Shipped' && selectedOrder?.status !== 'Delivered' && (
                                    <div>
                                      <h4 className="font-semibold mb-4">Add New Item</h4>
                                      <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                          <Label htmlFor="product">Product</Label>
                                          <Select
                                            value={newItem.product_id}
                                            onValueChange={(value) => setNewItem(prev => ({ ...prev, product_id: value }))}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select product" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                  {product.name} - {formatCurrency(product.price)}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div>
                                          <Label htmlFor="quantity">Quantity</Label>
                                          <Input
                                            id="quantity"
                                            type="number"
                                            min="1"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                            className="w-20"
                                          />
                                        </div>
                                        <Button onClick={addNewItem} disabled={!newItem.product_id}>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Delivery Details (admin only) */}
                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Delivery Details (Admin Only)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Delivery Address</Label>
                                        <Input value={selectedOrder?.delivery_address || ''} readOnly />
                                      </div>
                                      <div>
                                        <Label>Pincode</Label>
                                        <Input value={selectedOrder?.delivery_pincode || ''} readOnly />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Payment Details (view only) */}
                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Payment Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Total Amount</Label>
                                        <Input value={formatCurrency(selectedOrder?.total_amount || 0)} readOnly />
                                      </div>
                                      <div>
                                        <Label>Discount</Label>
                                        <Input value={formatCurrency(selectedOrder?.discount_amount || 0)} readOnly />
                                      </div>
                                      <div>
                                        <Label>Final Amount</Label>
                                        <Input value={formatCurrency(selectedOrder?.final_amount || 0)} readOnly />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Track Details (courier info, bill upload) */}
                                  <div className="border-t pt-4">
                                    <h4 className="font-semibold mb-2">Track Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Courier Partner Name</Label>
                                        <Input
                                          placeholder="Courier Partner Name"
                                          value={courierPartner}
                                          onChange={e => setCourierPartner(e.target.value)}
                                          disabled={selectedOrder?.status === 'Delivered'}
                                        />
                                      </div>
                                      <div>
                                        <Label>Tracking Number</Label>
                                        <Input
                                          placeholder="Tracking Number"
                                          value={trackingNumber}
                                          onChange={e => setTrackingNumber(e.target.value)}
                                          disabled={selectedOrder?.status === 'Delivered'}
                                        />
                                      </div>
                                      <div>
                                        <Label>Courier Bill Image</Label>
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          disabled={selectedOrder?.status === 'Delivered'}
                                          onChange={e => {
                                            const file = e.target.files?.[0] || null;
                                            setCourierBillFile(file);
                                            if (file) {
                                              setCourierBillPreview(URL.createObjectURL(file));
                                            } else {
                                              setCourierBillPreview(null);
                                            }
                                          }}
                                        />
                                        {courierBillPreview && (
                                          <div className="mt-2">
                                            <Image
                                              src={courierBillPreview}
                                              alt="Courier Bill Preview"
                                              width={120}
                                              height={120}
                                              className="rounded object-cover border"
                                            />
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              className="text-red-600 hover:text-red-700 mt-1"
                                              onClick={() => {
                                                setCourierBillFile(null);
                                                setCourierBillPreview(null);
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {/* Only allow upload/edit/delete before Delivered, and only after Mark as Paid (add logic in next step) */}
                                  </div>

                                  {/* Order Summary */}
                                  <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                      <span className="text-lg font-semibold">Total:</span>
                                      <span className="text-lg font-bold text-orange-600">
                                        {formatCurrency(editingItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-4">
                                    <Button onClick={saveOrderChanges} className="bg-orange-600 hover:bg-orange-700">
                                      Save Changes
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportOrderPDF(order)}
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
