"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/lib/cart'
import { formatCurrency } from '@/lib/utils'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { Trash2, Plus, Minus, ShoppingBag, Tag, Gift } from 'lucide-react'

interface PromoCode {
  id: string
  code: string
  discount_percentage: number
  description: string
  expiry_date: string
  is_active: boolean
  min_order_value: number | string
}

export default function CartPage() {
  const [promoCode, setPromoCode] = useState('')
  const [availablePromoCodes, setAvailablePromoCodes] = useState<PromoCode[]>([])
  const [filteredPromoCodes, setFilteredPromoCodes] = useState<PromoCode[]>([])
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [showPromoCodes, setShowPromoCodes] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    address: '',
    pincode: '',
    email: '',
    phone: ''
  })
  const [placing, setPlacing] = useState(false)
  const { customer } = useAuth()
  const { items, updateQuantity, removeItem, clearCart, total, loading } = useCart()
  const { toast } = useToast()
  const router = useRouter()

  // Remove applied promo if cart total drops below min_order_value
  const lastPromoCode = useRef<string | null>(null);
  useEffect(() => {
    if (appliedPromo) {
      lastPromoCode.current = appliedPromo.code;
      const minValue = typeof appliedPromo.min_order_value === 'number'
        ? appliedPromo.min_order_value
        : Number(appliedPromo.min_order_value || 0);
      if (total < minValue) {
        setAppliedPromo(null);
        setPromoCode('');
        toast({
          title: 'Promo Removed',
          description: `Cart value is below minimum required for ${lastPromoCode.current}`,
        });
      }
    }
  }, [total, appliedPromo]);

  useEffect(() => {
    if (!customer) {
      router.push('/login')
      return
    }
    // Pre-fill customer data
    setCheckoutData(prev => ({
      ...prev,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address || '',
      pincode: customer.pincode || ''
    }))
    fetchPromoCodes()
  }, [customer, router])

  useEffect(() => {
    // Filter promo codes by min_order_value
    setFilteredPromoCodes(availablePromoCodes.filter(promo => {
      if (typeof promo.min_order_value === 'number') {
        return total >= promo.min_order_value
      }
      return total >= Number(promo.min_order_value || 0)
    }))
  }, [availablePromoCodes, total])

  const fetchPromoCodes = async () => {
    try {
      const res = await fetch('/api/promocodes')
      if (!res.ok) throw new Error('Failed to fetch promo codes')
      if (!res.ok) {
        throw new Error('Failed to load promocodes')
      }
      const data = await res.json()
  setAvailablePromoCodes(data as PromoCode[])
    } catch (error) {
      console.error('Error fetching promo codes:', error)
    }
  }

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      await updateQuantity(cartItemId, newQuantity)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await removeItem(cartItemId)
      toast({
        title: "Item Removed",
        description: "Item removed from cart",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    }
  }

  const handleApplyPromo = async (selectedCode?: string) => {
    const codeToApply = selectedCode || promoCode.trim()
    if (!codeToApply) return

    try {
      const res = await fetch('/api/promocode-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToApply })
      })
      if (res.status === 404) {
        const result = await res.json();
        toast({
          title: "Invalid Promo Code",
          description: result.error || "Promo code is invalid or expired",
          variant: "destructive",
        });
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to validate promocode');
      }
      const promo = await res.json();
      setAppliedPromo(promo);
      setPromoCode(promo.code);
      setShowPromoCodes(false);
      toast({
        title: "Promo Applied",
        description: `${promo.discount_percentage}% discount applied!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply promo code",
        variant: "destructive",
      });
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    toast({
      title: "Promo Removed",
      description: "Promo code removed",
    })
  }

  const subtotal = total
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.discount_percentage) / 100 : 0
  const finalTotal = subtotal - discountAmount

  const handlePlaceOrder = async () => {
    if (!customer || items.length === 0) return
    
    if (!checkoutData.name || !checkoutData.address || !checkoutData.pincode || !checkoutData.email || !checkoutData.phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setPlacing(true)
    try {
      // Send order data to API endpoint
      const orderData = {
        customer_id: customer.id,
        delivery_name: checkoutData.name,
        delivery_address: checkoutData.address,
        delivery_pincode: checkoutData.pincode,
        delivery_email: checkoutData.email,
        delivery_phone: checkoutData.phone,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.products.price
        })),
        promo_code: appliedPromo?.code || null,
        discount_amount: discountAmount,
        final_amount: finalTotal
      };
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (!res.ok) throw new Error('Failed to place order');
      await clearCart();
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed and is pending approval",
      });
      router.push('/orders');
    } catch (error) {
      console.error('Place order error:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
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
          <div className="text-center">Loading cart...</div>
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
          <ShoppingBag className="h-8 w-8" />
          Shopping Cart
        </h1>

        {items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-4">Add some products to get started!</p>
              <Button asChild className="bg-orange-600 hover:bg-orange-700">
                <a href="/products">Continue Shopping</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Image
                        src={item.products.image_url || "/placeholder.svg"}
                        alt={item.products.name}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.products.name}</h3>
                        <p className="text-orange-600 font-medium">
                          {formatCurrency(item.products.price)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {item.products.stock_quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.products.stock_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(item.products.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary & Checkout */}
            <div className="space-y-6">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!appliedPromo ? (
                    <>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        />
                        <Button onClick={() => handleApplyPromo()} variant="outline">
                          Apply
                        </Button>
                      </div>
                      
                      {filteredPromoCodes.length > 0 && (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPromoCodes(!showPromoCodes)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Gift className="h-4 w-4 mr-2" />
                            View Available Codes ({filteredPromoCodes.length})
                          </Button>
                          {showPromoCodes && (
                            <div className="mt-3 space-y-2">
                              {filteredPromoCodes.map((promo) => (
                                <div
                                  key={promo.id}
                                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">{promo.code}</Badge>
                                      <span className="font-medium text-green-600">
                                        {parseInt(promo.discount_percentage.toString(), 10)}% OFF
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      Valid until {new Date(promo.expiry_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApplyPromo(promo.code)}
                                    className="bg-orange-600 hover:bg-orange-700"
                                  >
                                    Apply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">{appliedPromo.code}</Badge>
                          <span className="font-medium text-green-600">
                            {parseInt(appliedPromo.discount_percentage.toString(), 10)}% OFF Applied
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          You saved {formatCurrency(discountAmount)}!
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRemovePromo}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedPromo.discount_percentage}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatCurrency(finalTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Checkout Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={checkoutData.name}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={checkoutData.email}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={checkoutData.phone}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      value={checkoutData.address}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter your complete delivery address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={checkoutData.pincode}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, pincode: e.target.value }))}
                      placeholder="Enter pincode"
                      required
                    />
                  </div>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
                    onClick={handlePlaceOrder}
                    disabled={placing || items.length === 0}
                  >
                    {placing ? "Placing Order..." : `Place Order - ${formatCurrency(finalTotal)}`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
