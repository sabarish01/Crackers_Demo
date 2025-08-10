"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Star, ShoppingCart } from 'lucide-react'
// ...existing code...
import { useCart } from '@/lib/cart'
import { useAuth } from '@/contexts/auth-context'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  stock_quantity: number
  is_available: boolean
  categories: {
    name: string
  } | null
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const { addItem } = useCart()
  const { customer } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setError(null)
      const res = await fetch('/api/products?is_available=true&stock_quantity_gt=0&sort=created_at_desc&limit=8')
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching featured products:', error)
      setError(error instanceof Error ? error.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    if (!customer) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart",
        variant: "destructive",
      })
      router.push('/login')
      return
    }

    setAddingToCart(productId)
    try {
      await addItem(productId, 1)
      toast({
        title: "Added to Cart",
        description: "Product added to cart successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-800">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-4 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-6 bg-gray-200 animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-800">Featured Products</h2>
          <Alert className="max-w-2xl mx-auto">
            <AlertDescription>
              {error.includes('table') ? 
                'Database tables are not set up yet. Please run the database setup scripts first.' : 
                error
              }
            </AlertDescription>
          </Alert>
          {/* Show fallback products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {getFallbackProducts().map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.categories && (
                      <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
                        {product.categories.name}
                      </Badge>
                    )}
                    <div className="absolute top-2 right-2 flex items-center bg-white bg-opacity-90 rounded-full px-2 py-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium ml-1">4.5</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock_quantity}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="flex gap-2 w-full">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/products/${product.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button 
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingToCart === product.id}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-orange-800">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
              <CardContent className="p-0">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={product.image_url || "/placeholder.svg?height=300&width=300"}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.categories && (
                    <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
                      {product.categories.name}
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2 flex items-center bg-white bg-opacity-90 rounded-full px-2 py-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium ml-1">4.5</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.stock_quantity}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <div className="flex gap-2 w-full">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/products/${product.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={addingToCart === product.id}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
            <Link href="/products">
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

// Fallback products to show when database is not set up
function getFallbackProducts() {
  return [
    {
      id: '1',
      name: 'Electric Sparklers 10cm',
      description: 'Safe electric sparklers perfect for kids',
      price: 25.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Electric+Sparklers',
      stock_quantity: 100,
      is_available: true,
      categories: { name: 'Sparklers' }
    },
    {
      id: '2',
      name: 'Sky Shot Rockets',
      description: 'High altitude rockets with colorful effects',
      price: 120.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Sky+Shot+Rockets',
      stock_quantity: 50,
      is_available: true,
      categories: { name: 'Rockets' }
    },
    {
      id: '3',
      name: 'Dancing Spinner',
      description: 'Ground spinner with dancing lights',
      price: 45.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Dancing+Spinner',
      stock_quantity: 80,
      is_available: true,
      categories: { name: 'Ground Spinners' }
    },
    {
      id: '4',
      name: 'Golden Flower Pot',
      description: 'Traditional golden flower pot cracker',
      price: 65.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Golden+Flower+Pot',
      stock_quantity: 60,
      is_available: true,
      categories: { name: 'Flower Pots' }
    },
    {
      id: '5',
      name: 'Thunder Bomb',
      description: 'Loud sound cracker for celebrations',
      price: 15.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Thunder+Bomb',
      stock_quantity: 200,
      is_available: true,
      categories: { name: 'Bombs' }
    },
    {
      id: '6',
      name: 'Diwali Special Box',
      description: 'Assorted crackers perfect for Diwali',
      price: 299.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Diwali+Special+Box',
      stock_quantity: 30,
      is_available: true,
      categories: { name: 'Gift Boxes' }
    },
    {
      id: '7',
      name: 'Color Sparklers 15cm',
      description: 'Colorful sparklers with multiple colors',
      price: 35.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Color+Sparklers',
      stock_quantity: 150,
      is_available: true,
      categories: { name: 'Sparklers' }
    },
    {
      id: '8',
      name: 'Family Pack Box',
      description: 'Large assortment for family celebrations',
      price: 499.00,
      image_url: '/placeholder.svg?height=300&width=300&text=Family+Pack+Box',
      stock_quantity: 25,
      is_available: true,
      categories: { name: 'Gift Boxes' }
    }
  ]
}
