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
import { Package, Upload, Download, Eye, CreditCard, Truck, MapPin, Trash2 } from 'lucide-react'
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
  const [deleting, setDeleting] = useState(false)
  const [editPaymentDialogOrderId, setEditPaymentDialogOrderId] = useState<string | null>(null);
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
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', paymentScreenshot);
      const uploadRes = await fetch('/api/upload-payment-screenshot', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        toast({
          title: "Screenshot Upload Failed",
          description: uploadData.error || 'Could not upload screenshot. Please try again.',
          variant: "destructive",
        });
        return;
      }
      const screenshotUrl = uploadData.url;

      // Update order with screenshot URL and reference number
      const res = await fetch(`/api/orders/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          payment_screenshot_url: screenshotUrl,
          bank_reference_number: bankReference
        })
      });
      const resData = await res.json();
      if (!res.ok || resData.error) {
        toast({
          title: "Payment Details Upload Failed",
          description: resData.error || 'Could not upload payment details. Please check your info and try again.',
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Payment Details Uploaded",
        description: "Your payment details have been submitted for verification",
      });

      fetchOrders();
      setPaymentScreenshot(null);
      setBankReference('');
      setEditPaymentDialogOrderId(null); // Close dialog after successful upload
    } catch (error) {
      console.error('Payment upload error:', error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }


  const handleDeletePayment = async (orderId: string) => {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete uploaded payment details?') : true;
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/payment`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (!res.ok) throw new Error('Failed to delete payment details');
      toast({ title: 'Deleted', description: 'Payment details removed. You can upload again.' });
      fetchOrders();
    } catch (error) {
      console.error('Delete payment error:', error);
      toast({ title: 'Error', description: 'Failed to delete payment details', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }


  const exportOrderPDF = (order: Order) => {
    try {
      // Add payment and shipping details (with images) to the PDF
      generateOrderPDF(order);
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
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-800 mb-6 sm:mb-8 flex items-center gap-2 justify-center sm:justify-start">
          <Package className="h-7 w-7 sm:h-8 sm:w-8" />
          My Orders
        </h1>
        {orders.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <CardContent>
              <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-xs sm:text-base text-gray-600 mb-4">Start shopping to see your orders here!</p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700 text-sm sm:text-base">
                <a href="/products">Start Shopping</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                {/* Notification Banner for updated items */}
                {order.order_items.some(item => item.isModified || item.isNew) && !['Shipped','Delivered','Cancelled'].includes(order.status) && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-2 sm:p-3 flex flex-col gap-1">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Order #{order.id.slice(-8)}
                        {order.items_modified && (
                          <Badge className="bg-red-600 text-white animate-pulse ml-2">Updated Items</Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Placed on {formatDate(order.created_at)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {getStatusDescription(order.status)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      {order.status === 'Paid' && order.payment_screenshot_url ? (
                        <Badge className="bg-blue-600 text-white mb-2">Payment Uploaded</Badge>
                      ) : (
                        <Badge className={`${getStatusColor(order.status)} text-white mb-2`}>
                          {order.status}
                        </Badge>
                      )}
                      <p className="text-base sm:text-lg font-semibold text-orange-600">
                        <span className="mr-1 text-gray-700">Total Amount:</span>{formatCurrency(order.final_amount)}
                      </p>
                      {order.promocodes && (
                        <Badge variant="secondary" className="mt-1">
                          {order.promocodes.code} Applied
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Items Ordered
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <Image
                              src={item.products.image_url || "/placeholder.svg"}
                              alt={item.products.name}
                              width={50}
                              height={50}
                              className="rounded object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-xs sm:text-sm">{item.products.name}</p>
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
                    </div>
                    {/* Hide details if status is Delivered or Cancelled */}
                    {!(order.status === 'Delivered' || order.status === 'Cancelled') && (
                      <div className="space-y-2 sm:space-y-4">
                        {/* Order Details */}
                        <div>
                          <h4 className="font-semibold mb-1 sm:mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Delivery Details
                          </h4>
                          <div className="text-xs sm:text-sm space-y-1 bg-gray-50 p-2 sm:p-3 rounded-lg">
                            <p><strong>Name:</strong> {order.delivery_name}</p>
                            <p><strong>Email:</strong> {order.delivery_email}</p>
                            <p><strong>Phone:</strong> {order.delivery_phone}</p>
                            <p><strong>Address:</strong> {order.delivery_address}</p>
                            <p><strong>Pincode:</strong> {order.delivery_pincode}</p>
                            {/* Edit Delivery Details Button */}
                            {['Pending','Accepted','Paid','Packed'].includes(order.status) && order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
                                <Dialog open={editingOrderId === order.id} onOpenChange={open => { if (!open) setEditingOrderId(null); }}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto mt-2" onClick={() => handleEditDelivery(order)}>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Edit Delivery Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Delivery Details</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-2 sm:space-y-3">
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
                                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 sm:mt-4">
                                        <Button onClick={handleSaveDelivery} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">Save</Button>
                                        <Button variant="outline" onClick={() => setEditingOrderId(null)} className="w-full sm:w-auto">Cancel</Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Payment Information */}
                        {order.payment_screenshot_url && (
                          <div>
                            <h4 className="font-semibold mb-1 sm:mb-2 flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Payment Details
                            </h4>
                            <div className="text-xs sm:text-sm bg-green-50 p-2 sm:p-3 rounded-lg border border-green-200">
                              <p><strong>Reference:</strong> {order.bank_reference_number}</p>
                              <p className="text-green-600 font-medium">Payment screenshot uploaded</p>
                              <div className="mt-2">
                                <a href={order.payment_screenshot_url} target="_blank" rel="noopener noreferrer">
                                  <Image
                                    src={order.payment_screenshot_url}
                                    alt="Payment Screenshot"
                                    width={200}
                                    height={200}
                                    className="rounded border object-cover"
                                  />
                                </a>
                              </div>
                              {['Pending', 'Accepted'].includes(order.status) && (
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
                                  <Dialog open={editPaymentDialogOrderId === order.id} onOpenChange={open => setEditPaymentDialogOrderId(open ? order.id : null)}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto mt-2"
                                        onClick={() => {
                                          setBankReference(order.bank_reference_number || '');
                                          setPaymentScreenshot(null);
                                          setEditPaymentDialogOrderId(order.id);
                                        }}
                                      >
                                        <Upload className="h-4 w-4 mr-1" />
                                        Edit Payment Screenshot
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Edit Payment Screenshot</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-2 sm:space-y-4">
                                        <div>
                                          <Label htmlFor="screenshot-edit">New Payment Screenshot *</Label>
                                          <Input
                                            id="screenshot-edit"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                                          />
                                          <p className="text-xs text-gray-500 mt-1">
                                            Upload a new screenshot of your payment confirmation
                                          </p>
                                        </div>
                                        <div>
                                          <Label htmlFor="reference-edit">Bank Reference Number *</Label>
                                          <Input
                                            id="reference-edit"
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
                                          {uploading ? "Uploading..." : "Update Payment Details"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full sm:w-auto mt-2 border-red-600 text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeletePayment(order.id)}
                                    disabled={deleting}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {deleting ? 'Deleting...' : 'Delete Payment Details'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                          {/* Shipping Information (show only when status is Shipped) */}
                          {order.status === 'Shipped' && (order.courier_partner || order.tracking_number || order.courier_bill_url) && (
                          <div>
                            <h4 className="font-semibold mb-1 sm:mb-2 flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Shipping Details
                            </h4>
                            <div className="text-xs sm:text-sm bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-200 space-y-1">
                              {/* Tracking/Courier Info */}
                              {order.courier_partner && <p><strong>Courier:</strong> {order.courier_partner}</p>}
                              {order.tracking_number && (
                                <p><strong>Tracking Number:</strong> <span className="font-mono ml-1">{order.tracking_number}</span></p>
                              )}
                              {/* Courier Bill */}
                              {order.courier_bill_url && (
                                <div className="mt-2">
                                  <p className="text-xs sm:text-sm text-gray-700 mb-1"><b>Courier Bill:</b></p>
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {order.status === 'Accepted' && !order.payment_screenshot_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
                            <Upload className="h-4 w-4 mr-1" />
                            Upload Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Payment Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 sm:space-y-4">
                            <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2">Payment Instructions</h4>
                              <div className="text-xs sm:text-sm text-blue-700 space-y-1">
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details - #{order.id.slice(-8)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 sm:space-y-6">
                          {/* Items Details FIRST */}
                          <div>
                            <h4 className="font-semibold mb-2 sm:mb-3">Items Details</h4>
                            <div className="space-y-1 sm:space-y-2">
                              {order.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs sm:text-sm p-2 bg-gray-50 rounded">
                                  <span>{item.products.name}</span>
                                  <span>{item.quantity} × {formatCurrency(item.price)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Order Summary SECOND */}
                          <div>
                            <h4 className="font-semibold mb-2 sm:mb-3">Order Summary</h4>
                            <div className="text-xs sm:text-sm space-y-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => exportOrderPDF(order)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}






