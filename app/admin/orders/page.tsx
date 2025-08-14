"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { generateOrderPDF } from '@/lib/pdf-export'
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
  promo_code?: string | null
  delivery_address: string
  delivery_pincode: string
  delivery_name?: string | null
  delivery_email?: string | null
  delivery_phone?: string | null
  status: string
  created_at: string
  customers: {
    name: string
    email: string
    phone: string
  }
  order_items: OrderItem[]
  payment_screenshot_url?: string | null
  bank_reference_number?: string | null
  courier_partner?: string | null
  tracking_number?: string | null
  courier_bill_url?: string | null
}

interface Product {
  id: string
  name: string
  price: number
  stock_quantity: number
}

interface Promo {
  code: string
  discount_percentage: number
  min_order_value: number
  is_active?: number
  expiry_date?: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [editingItems, setEditingItems] = useState<OrderItem[]>([])
  const [promos, setPromos] = useState<Promo[]>([])
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('')
  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1
  })
  // Track Details state
  const [courierPartner, setCourierPartner] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierBillFile, setCourierBillFile] = useState<File | null>(null)
  const [courierBillPreview, setCourierBillPreview] = useState<string | null>(null)
  const [courierBillRemoved, setCourierBillRemoved] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  fetchPromos()
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

  const fetchPromos = async () => {
    try {
      const res = await fetch('/api/promocodes')
      if (!res.ok) return
      const list = await res.json()
      setPromos(list || [])
    } catch {}
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
  setSelectedPromoCode(order.promo_code || '')
  setNewItem({ product_id: '', quantity: 1 })
  // Prefill track details if available
  setCourierPartner(order.courier_partner || '')
  setTrackingNumber(order.tracking_number || '')
  setCourierBillFile(null)
  setCourierBillPreview(order.courier_bill_url || null)
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
    if (!selectedOrder) return;

    try {
      let courierBillImageUrl = '';
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
      } else if (courierBillRemoved) {
        courierBillImageUrl = '';
      } else {
        courierBillImageUrl = selectedOrder.courier_bill_url || '';
      }

      // Determine if any item is new or modified
      const itemsModified = editingItems.some(item => item.isNew || item.isModified);

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
          promo_code: selectedPromoCode || null,
          courier_partner: courierPartner,
          tracking_number: trackingNumber,
          courier_bill_image: courierBillImageUrl, // <-- changed key here
          items_modified: itemsModified
        })
      });
      if (!response.ok) throw new Error('Failed to update order');
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      fetchOrders();
      setSelectedOrder(null);
      setCourierBillRemoved(false);
      // Redirect to order list after save
      window.location.href = '/admin/orders';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  }

  // Removed legacy exportOrderPDF; using shared generator

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
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        {order.status === 'Accepted' && order.payment_screenshot_url && (
                          <div className="mt-2 flex flex-col gap-1">
                            <Badge className="bg-blue-600 text-white px-2 py-1 text-xs w-fit">Batch Payment Uploaded</Badge>
                            <span className="text-xs text-gray-600">Verify the payment screenshot and update status to <b>Paid</b> if valid.</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
                                  {/* 1) Items Details (Card) */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Items Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-4">
                                        <div>
                                          <div className="grid grid-cols-12 gap-2 px-2 py-1 text-xs font-semibold text-gray-600">
                                            <div className="col-span-6">Product</div>
                                            <div className="col-span-3 text-center">Quantity</div>
                                            <div className="col-span-2 text-right">Actions</div>
                                            <div className="col-span-1 text-right">Price</div>
                                          </div>
                                          <div className="space-y-2">
                                            {editingItems.map((item) => (
                                              <div key={item.id} className="grid grid-cols-12 items-center text-sm p-2 border-b last:border-b-0">
                                                <div className="col-span-6 truncate flex items-center gap-2">
                                                  {item.products.name}
                                                  {item.isModified ? (
                                                    <Badge className="bg-yellow-500 text-white">Modified</Badge>
                                                  ) : item.isNew ? (
                                                    <Badge className="bg-green-600 text-white">New</Badge>
                                                  ) : null}
                                                </div>
                                                  <div className="col-span-3 flex items-center justify-center">
                                                    <Button
                                                      variant="outline"
                                                      size="icon"
                                                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                                      disabled={item.quantity <= 1 || selectedOrder?.status === 'Shipped' || selectedOrder?.status === 'Delivered' || selectedOrder?.status === 'Cancelled'}
                                                    >
                                                      <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <span className="w-8 text-center font-medium flex items-center justify-center">{item.quantity}</span>
                                                    <Button
                                                      variant="outline"
                                                      size="icon"
                                                      onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                                      disabled={item.quantity >= item.products.stock_quantity || selectedOrder?.status === 'Shipped' || selectedOrder?.status === 'Delivered' || selectedOrder?.status === 'Cancelled'}
                                                    >
                                                      <Plus className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                <div className="col-span-2 flex justify-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    disabled={selectedOrder?.status === 'Shipped' || selectedOrder?.status === 'Delivered' || selectedOrder?.status === 'Cancelled'}
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                                <div className="col-span-1 text-right font-medium">{formatCurrency(item.price)}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {/* Promo Code Selector */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {selectedOrder?.status !== 'Shipped' && selectedOrder?.status !== 'Delivered' && selectedOrder?.status !== 'Cancelled' && (
                                            <div>
                                              <Label>Promo Code</Label>
                                              <Select value={selectedPromoCode || 'NONE'} onValueChange={(val) => setSelectedPromoCode(val === 'NONE' ? '' : val)}>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Select promo (optional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="NONE">No Promo</SelectItem>
                                                  {promos.map(p => (
                                                    <SelectItem key={p.code} value={p.code}>{p.code} - {p.discount_percentage}% (Min {formatCurrency(Number(p.min_order_value || 0))})</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )}
                                        </div>
                                        {/* Inline Order Summary (DB values) */}
                                        <div className="text-sm space-y-2">
                                          {(() => {
                                            const subtotal = editingItems.reduce((sum, it) => sum + (it.price * it.quantity), 0)
                                            const promo = promos.find(p => p.code === selectedPromoCode)
                                            const eligible = promo ? subtotal >= Number(promo.min_order_value || 0) : false
                                            const discount = promo && eligible ? Math.floor((subtotal * Number(promo.discount_percentage || 0)) / 100) : 0
                                            const total = Math.max(subtotal - discount, 0)
                                            return (
                                              <>
                                                <div className="flex justify-between">
                                                  <span>Subtotal:</span>
                                                  <span>{formatCurrency(subtotal)}</span>
                                                </div>
                                                {discount > 0 ? (
                                                  <div className="flex justify-between text-green-600">
                                                    <span>Discount ({promo?.code}):</span>
                                                    <span>-{formatCurrency(discount)}</span>
                                                  </div>
                                                ) : promo && !eligible ? (
                                                  <div className="flex justify-between text-amber-600">
                                                    <span>Discount ({promo.code}):</span>
                                                    <span>Not eligible</span>
                                                  </div>
                                                ) : null}
                                                <div className="flex justify-between font-semibold border-t pt-2">
                                                  <span>Total:</span>
                                                  <span>{formatCurrency(total)}</span>
                                                </div>
                                              </>
                                            )
                                          })()}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* 2) Add New Item (Card, only before Shipped) */}
                                  {selectedOrder?.status !== 'Shipped' && selectedOrder?.status !== 'Delivered' && selectedOrder?.status !== 'Cancelled' && (
                                      <Card>
                                      <CardHeader>
                                        <CardTitle>Add New Item</CardTitle>
                                      </CardHeader>
                                      <CardContent>
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
                                        <div className="col-span-3 text-center">
                                          <Label>Quantity</Label>
                                          
                                          <div className="flex items-center gap-2">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setNewItem(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
                                                disabled={newItem.quantity <= 1}
                                              >
                                                <Minus className="h-4 w-4" />
                                              </Button>
                                              <span className="w-10 text-center font-medium flex items-center justify-center" style={{ marginLeft: 'auto', marginRight: 'auto' }}>{newItem.quantity}</span>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                  const selected = products.find(p => p.id === newItem.product_id);
                                                  const maxQty = selected?.stock_quantity ?? Infinity;
                                                  setNewItem(prev => ({ ...prev, quantity: Math.min((prev.quantity || 1) + 1, maxQty) }))
                                                }}
                                                disabled={(() => {
                                                  const selected = products.find(p => p.id === newItem.product_id);
                                                  return selected ? newItem.quantity >= selected.stock_quantity : false;
                                                })()}
                                              >
                                                <Plus className="h-4 w-4" />
                                              </Button>
                                          </div>
                                        </div>
                                        <Button onClick={addNewItem} disabled={!newItem.product_id}>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add
                                        </Button>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    )}

                                  {/* 3) Payment Details (Card) */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Payment Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="mb-2">
                                        <span className="font-medium">Reference Number:</span>
                                        <span className="ml-2">{selectedOrder?.bank_reference_number || '-'}</span>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-medium">Screenshot:</span>
                                        {selectedOrder?.payment_screenshot_url ? (
                                          <a href={selectedOrder.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                                            <Image
                                              src={selectedOrder.payment_screenshot_url}
                                              alt="Payment Screenshot"
                                              width={160}
                                              height={160}
                                              className="rounded border object-cover mt-2"
                                            />
                                          </a>
                                        ) : (
                                          <span className="ml-2">-</span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* 4) Delivery Information (Card) */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Delivery Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="mb-2">
                                        <span className="font-medium">Name:</span>
                                        <span className="ml-2">{selectedOrder?.delivery_name || '-'}</span>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-medium">Email:</span>
                                        <span className="ml-2">{selectedOrder?.delivery_email || '-'}</span>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-medium">Phone:</span>
                                        <span className="ml-2">{selectedOrder?.delivery_phone || '-'}</span>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-medium">Address:</span>
                                        <span className="ml-2">{selectedOrder?.delivery_address || '-'}</span>
                                      </div>
                                      <div className="mb-2">
                                        <span className="font-medium">Pincode:</span>
                                        <span className="ml-2">{selectedOrder?.delivery_pincode || '-'}</span>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* 5) Shipping Details (Card) */}
                                  {selectedOrder && (selectedOrder.status === 'Paid' || selectedOrder.status === 'Shipped') && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle>Shipping Details</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="mb-2">
                                          <Label>Courier Partner</Label>
                                          <Input
                                            placeholder="Courier Partner Name"
                                            value={courierPartner}
                                            onChange={e => setCourierPartner(e.target.value)}
                                          />
                                        </div>
                                        <div className="mb-2">
                                          <Label>Tracking Number</Label>
                                          <Input
                                            placeholder="Tracking Number"
                                            value={trackingNumber}
                                            onChange={e => setTrackingNumber(e.target.value)}
                                          />
                                        </div>
                                        <div className="mb-2">
                                          <Label>Courier Bill Image</Label>
                                          <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                              const file = e.target.files?.[0] || null;
                                              setCourierBillFile(file);
                                              if (file) {
                                                setCourierBillPreview(URL.createObjectURL(file));
                                              } else {
                                                setCourierBillPreview(selectedOrder?.courier_bill_url || null);
                                              }
                                            }}
                                          />
                                          {(courierBillPreview || selectedOrder?.courier_bill_url) && (
                                            <div className="mt-2">
                                              <Image
                                                src={(courierBillPreview || selectedOrder?.courier_bill_url) ?? "/placeholder.svg"}
                                                alt="Courier Bill Preview"
                                                width={120}
                                                height={120}
                                                className="rounded object-cover border"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                  {/* Show view-only shipping card for Delivered status */}
                                  {selectedOrder && selectedOrder.status === 'Delivered' && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle>Shipping Details</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="mb-2">
                                          <span className="font-medium">Courier Partner:</span>
                                          <span className="ml-2">{selectedOrder.courier_partner || '-'}</span>
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-medium">Tracking Number:</span>
                                          <span className="ml-2">{selectedOrder.tracking_number || '-'}</span>
                                        </div>
                                        <div className="mb-2">
                                          <span className="font-medium">Courier Bill:</span>
                                          {selectedOrder.courier_bill_url ? (
                                            <a href={selectedOrder.courier_bill_url} target="_blank" rel="noopener noreferrer">
                                              <Image
                                                src={selectedOrder.courier_bill_url}
                                                alt="Courier Bill"
                                                width={120}
                                                height={120}
                                                className="rounded object-cover border mt-2"
                                              />
                                            </a>
                                          ) : (
                                            <span className="ml-2">-</span>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}

                                  <div className="flex gap-2 pt-4">
                                    {selectedOrder?.status !== 'Delivered' && selectedOrder?.status !== 'Cancelled' && (
                                      <Button onClick={saveOrderChanges} className="bg-orange-600 hover:bg-orange-700">
                                        Save Changes
                                      </Button>
                                    )}
                                    <DialogTrigger asChild>
                                      <Button variant="outline" type="button" onClick={() => setSelectedOrder(null)}>
                                        Cancel
                                      </Button>
                                    </DialogTrigger>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateOrderPDF(order as any)}
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
