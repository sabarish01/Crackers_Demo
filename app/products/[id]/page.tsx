"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/lib/cart'
// ...existing code...
import { formatCurrency } from '@/lib/utils'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'
import { ArrowLeft, ShoppingCart, Plus, Minus, Star, Package, Shield, Truck } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number
  is_available: boolean
  category_id: string
  categories?: {
    name: string
  }
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const { customer } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
    // eslint-disable-next-line
  }, [productId])

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`)
      if (!res.ok) {
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive",
        })
        router.push('/products')
        return
      }
      if (!res.ok) {
        throw new Error('Failed to load product')
      }
      const data = await res.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      })
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!customer) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    if (!product) return

    setAddingToCart(true)
    try {
      await addItem(product.id, quantity)
      toast({
        title: "Added to Cart",
        description: `${quantity} ${product.name}(s) added to your cart`,
      })
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (product && newQuantity > product.stock_quantity) return
    setQuantity(newQuantity)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading product...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Button asChild>
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link href="/" className="text-orange-600 hover:text-orange-700">Home</Link>
          <span>/</span>
          <Link href="/products" className="text-orange-600 hover:text-orange-700">Products</Link>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </div>

        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-96 object-cover"
                />
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.categories && (
                  <Badge variant="secondary">{product.categories.name}</Badge>
                )}
                {product.is_available ? (
                  <Badge className="bg-green-500">In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8 out of 5)</span>
              </div>
              <p className="text-4xl font-bold text-orange-600 mb-4">
                {formatCurrency(product.price)}
              </p>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {product.description || "Experience the joy and excitement of our premium quality crackers. Perfect for celebrations, festivals, and special occasions. Made with the finest materials and crafted with care to ensure safety and maximum enjoyment."}
                </p>
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Stock Available:</span>
                  <span className={product.stock_quantity > 10 ? "text-green-600" : "text-orange-600"}>
                    {product.stock_quantity} units
                  </span>
                </div>
                {product.stock_quantity <= 10 && product.stock_quantity > 0 && (
                  <p className="text-sm text-orange-600">Only {product.stock_quantity} left in stock!</p>
                )}
              </CardContent>
            </Card>

            {/* Quantity Selector and Add to Cart */}
            {product.is_available && product.stock_quantity > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Quantity:</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                          min="1"
                          max={product.stock_quantity}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= product.stock_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {addingToCart ? "Adding..." : `Add to Cart - ${formatCurrency(product.price * quantity)}`}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleAddToCart()
                          setTimeout(() => router.push('/cart'), 1000)
                        }}
                        disabled={addingToCart}
                        className="w-full"
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Button disabled className="w-full">
                    {product.stock_quantity === 0 ? "Out of Stock" : "Currently Unavailable"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Safety Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <span className="text-sm">Secure Packaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm">Premium Quality</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
