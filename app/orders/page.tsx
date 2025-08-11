// ...existing code...

// ...existing code...
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
// ...existing code...
import { formatCurrency, formatDate } from '@/lib/utils'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Package, Upload, Download, Eye, CreditCard, Truck, MapPin } from 'lucide-react'
import { generateOrderPDF } from '@/lib/pdf-export'

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    image_url: string;
  };
  isModified?: boolean;
  isNew?: boolean;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null)
  const [bankReference, setBankReference] = useState('')
  const [uploading, setUploading] = useState(false)
  const { customer } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editDelivery, setEditDelivery] = useState({
    delivery_name: '',
    delivery_email: '',
    delivery_phone: '',
    delivery_address: '',
    delivery_pincode: ''
  });

  const handleEditDelivery = (order: Order) => {
    setEditingOrderId(order.id);
    setEditDelivery({
      delivery_name: order.delivery_name || '',
      delivery_email: order.delivery_email || '',
      delivery_phone: order.delivery_phone || '',
      delivery_address: order.delivery_address || '',
      delivery_pincode: order.delivery_pincode || ''
    });
  };

  async function handleSaveDelivery() {
    if (!editingOrderId) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: editingOrderId, ...editDelivery })
      });
      if (!res.ok) throw new Error('Failed to update delivery details');
      toast({ title: 'Delivery details updated' });
      setEditingOrderId(null);
      fetchOrders();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update delivery details', variant: 'destructive' });
    }
  }

  useEffect(() => {
    if (!customer) {
      router.push('/login')
      return
    }
    fetchOrders()
  }, [customer, router])

  async function fetchOrders() {
    if (!customer) return;
    try {
      const res = await fetch(`/api/orders?customer_id=${customer.id}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500'
      case 'Accepted': return 'bg-blue-500'
      case 'Paid': return 'bg-green-500'
      case 'Packed': return 'bg-purple-500'
      case 'Shipped': return 'bg-indigo-500'
      case 'Delivered': return 'bg-green-600'
      case 'Cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'Pending': return 'Order placed, waiting for admin approval'
      case 'Accepted': return 'Order accepted, please upload payment details'
      case 'Paid': return 'Payment verified, order being prepared'
      case 'Packed': return 'Order packed and ready for shipping'
      case 'Shipped': return 'Order shipped, tracking details available'
      case 'Delivered': return 'Order delivered successfully'
      case 'Cancelled': return 'Order cancelled'
      default: return 'Unknown status'
    }
  }

  const handlePaymentUpload = async (orderId: string) => {
    if (!paymentScreenshot || !bankReference.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a screenshot and enter bank reference number",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Simulate file upload and update order in MySQL
      const fileExt = paymentScreenshot.name.split('.').pop()
      const fileName = `payment_${orderId}_${Date.now()}.${fileExt}`
      const screenshotUrl = `/uploads/payments/${fileName}`

      // In production, upload file to server here

      const res = await fetch(`/api/orders/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          payment_screenshot_url: screenshotUrl,
          bank_reference_number: bankReference
        })
      })
      if (!res.ok) throw new Error('Failed to upload payment details')

      toast({
        title: "Payment Details Uploaded",
        description: "Your payment details have been submitted for verification",
      })

      fetchOrders()
      setPaymentScreenshot(null)
      setBankReference('')
    } catch (error) {
      console.error('Payment upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload payment details",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const exportOrderPDF = (order: Order) => {
    try {
      generateOrderPDF(order)
      toast({
        title: "PDF Generated",
        description: "Order PDF has been generated and will open in a new window",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  if (!customer) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading orders...</div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-orange-800 mb-8 flex items-center gap-2">
          <Package className="h-8 w-8" />
          My Orders
        </h1>

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-gray-600 mb-4">Start shopping to see your orders here!</p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <a href="/products">Start Shopping</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
                {/* Notification Banner for updated items */}
                {order.order_items.some(item => item.isModified || item.isNew) && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 flex flex-col gap-1">
                    <span className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      This order has updated items:
                    </span>
                    <ul className="list-disc list-inside ml-2">
                      {order.order_items.filter(item => item.isModified || item.isNew).map(item => (
                        <li key={item.id}>
                          <span className="font-medium">{item.products.name}</span>
                          {item.isModified ? (
                            <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">Modified</span>
                          ) : item.isNew ? (
                            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">New</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order #{order.id.slice(-8)}
                        {order.items_modified && (
                          <Badge className="bg-red-600 text-white animate-pulse ml-2">Updated Items</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {formatDate(order.created_at)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {getStatusDescription(order.status)}
                      </p>
                    </div>
                    <div className="text-right">
                      {order.status === 'Paid' && order.payment_screenshot_url ? (
                        <Badge className="bg-blue-600 text-white mb-2">Payment Uploaded</Badge>
                      ) : (
                        <Badge className={`${getStatusColor(order.status)} text-white mb-2`}>
                          {order.status}
                        </Badge>
                      )}
                      <p className="text-lg font-semibold text-orange-600">
                        {formatCurrency(order.final_amount)}
                      </p>
                      {order.promocodes && (
                        <Badge variant="secondary" className="mt-1">
                          {order.promocodes.code} Applied
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Items Ordered
                      </h4>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Image
                              src={item.products.image_url || "/placeholder.svg"}
                              alt={item.products.name}
                              width={50}
                              height={50}
                              className="rounded object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{item.products.name}</p>
                                {item.isModified ? (
                                  <Badge className="bg-yellow-500 text-white">Modified</Badge>
                                ) : item.isNew ? (
                                  <Badge className="bg-green-600 text-white">New</Badge>
                                ) : null}
                              </div>
                              <p className="text-xs text-gray-600">
                                Qty: {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.quantity * item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Courier & Tracking Info */}
                      {(order.courier_partner || order.tracking_number || order.courier_bill_url) && (
                        <div className="mt-6">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery & Tracking
                          </h4>
                          {order.courier_partner && (
                            <p className="text-sm text-gray-700 mb-1"><b>Courier Partner:</b> {order.courier_partner}</p>
                          )}
                          {order.tracking_number && (
                            <p className="text-sm text-gray-700 mb-1"><b>Tracking Number:</b> {order.tracking_number}</p>
                          )}
                          {order.courier_bill_url && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700 mb-1"><b>Courier Bill:</b></p>
                              <a href={order.courier_bill_url} target="_blank" rel="noopener noreferrer">
                                <Image
                                  src={order.courier_bill_url}
                                  alt="Courier Bill"
                                  width={120}
                                  height={120}
                                  className="rounded border object-cover"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Delivery Details
                        </h4>
                        <div className="text-sm space-y-1 bg-gray-50 p-3 rounded-lg">
                          <p><strong>Name:</strong> {order.delivery_name}</p>
                          <p><strong>Email:</strong> {order.delivery_email}</p>
                          <p><strong>Phone:</strong> {order.delivery_phone}</p>
                          <p><strong>Address:</strong> {order.delivery_address}</p>
                          <p><strong>Pincode:</strong> {order.delivery_pincode}</p>
                        </div>
                      </div>

                      {/* Payment Information */}
                      {order.payment_screenshot_url && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Details
                          </h4>
                          <div className="text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                            <p><strong>Reference:</strong> {order.bank_reference_number}</p>
                            <p className="text-green-600 font-medium">Payment screenshot uploaded</p>
                          </div>
                        </div>
                      )}

                      {/* Shipping Information */}
                      {(order.courier_partner || order.tracking_number) && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Shipping Details
                          </h4>
                          <div className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                            {order.courier_partner && (
                              <p><strong>Courier:</strong> {order.courier_partner}</p>
                            )}
                            {order.tracking_number && (
                              <p><strong>Tracking Number:</strong> 
                                <span className="font-mono ml-1">{order.tracking_number}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                    {/* Edit Delivery Details Button (left of View Details) */}
                    {['Pending','Accepted','Paid','Packed'].includes(order.status) && (
                      <Dialog open={editingOrderId === order.id} onOpenChange={open => { if (!open) setEditingOrderId(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleEditDelivery(order)}>
                            Edit Delivery Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Delivery Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Label>Name</Label>
                            <Input value={editDelivery.delivery_name} onChange={e => setEditDelivery(d => ({ ...d, delivery_name: e.target.value }))} />
                            <Label>Email</Label>
                            <Input value={editDelivery.delivery_email} onChange={e => setEditDelivery(d => ({ ...d, delivery_email: e.target.value }))} />
                            <Label>Phone</Label>
                            <Input value={editDelivery.delivery_phone} onChange={e => setEditDelivery(d => ({ ...d, delivery_phone: e.target.value }))} />
                            <Label>Address</Label>
                            <Input value={editDelivery.delivery_address} onChange={e => setEditDelivery(d => ({ ...d, delivery_address: e.target.value }))} />
                            <Label>Pincode</Label>
                            <Input value={editDelivery.delivery_pincode} onChange={e => setEditDelivery(d => ({ ...d, delivery_pincode: e.target.value }))} />
                            <div className="flex gap-2 mt-4">
                              <Button onClick={handleSaveDelivery} className="bg-orange-600 hover:bg-orange-700">Save</Button>
                              <Button variant="outline" onClick={() => setEditingOrderId(null)}>Cancel</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {/* View Details Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - #{order.id.slice(-8)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Items Details FIRST */}
                          <div>
                            <h4 className="font-semibold mb-3">Items Details</h4>
                            <div className="space-y-2">
                              {order.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                                  <span>{item.products.name}</span>
                                  <span>{item.quantity} × {formatCurrency(item.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Order Summary SECOND */}
                          <div>
                            <h4 className="font-semibold mb-3">Order Summary</h4>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(order.total_amount)}</span>
                              </div>
                              {order.discount_amount > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount:</span>
                                  <span>-{formatCurrency(order.discount_amount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold border-t pt-2">
                                <span>Total:</span>
                                <span>{formatCurrency(order.final_amount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {order.status === 'Accepted' && !order.payment_screenshot_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Payment Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-800 mb-2">Payment Instructions</h4>
                              <div className="text-sm text-blue-700 space-y-1">
                                <p><strong>Bank:</strong> State Bank of India</p>
                                <p><strong>Account:</strong> 1234567890</p>
                                <p><strong>IFSC:</strong> SBIN0001234</p>
                                <p><strong>Amount:</strong> {formatCurrency(order.final_amount)}</p>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="screenshot">Payment Screenshot *</Label>
                              <Input
                                id="screenshot"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Upload a screenshot of your payment confirmation
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="reference">Bank Reference Number *</Label>
                              <Input
                                id="reference"
                                value={bankReference}
                                onChange={(e) => setBankReference(e.target.value)}
                                placeholder="Enter transaction reference number"
                              />
                            </div>
                            <Button
                              onClick={() => handlePaymentUpload(order.id)}
                              disabled={uploading}
                              className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                              {uploading ? "Uploading..." : "Upload Payment Details"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportOrderPDF(order)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export PDF
                    </Button>

                    {order.tracking_number && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // In a real app, this would open the courier's tracking page
                          toast({
                            title: "Tracking Information",
                            description: `Track your order with ${order.courier_partner} using: ${order.tracking_number}`,
                          })
                        }}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Track Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
