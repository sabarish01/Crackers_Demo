"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
// ...existing code...

interface Category {
  id: string
  name: string
  description: string
  image_url: string
}

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setError(null)
      const res = await fetch('/api/categories?sort=name')
      if (!res.ok) throw new Error('Failed to load categories')
      const data = await res.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError(error instanceof Error ? error.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-800">Shop by Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-48 bg-gray-200 animate-pulse" />
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 animate-pulse rounded mb-2" />
                    <div className="h-4 bg-gray-200 animate-pulse rounded" />
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
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-orange-800">Shop by Categories</h2>
          <Alert className="max-w-2xl mx-auto">
            <AlertDescription>
              {error.includes('table') ? 
                'Database tables are not set up yet. Please run the database setup scripts first.' : 
                error
              }
            </AlertDescription>
          </Alert>
          {/* Show fallback categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {getFallbackCategories().map((category) => (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-semibold">{category.name}</h3>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-orange-800">Shop by Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={category.image_url || "/placeholder.svg?height=200&width=200"}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-semibold">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600 text-sm">{category.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Fallback categories to show when database is not set up
function getFallbackCategories() {
  return [
    {
      id: '1',
      name: 'Sparklers',
      description: 'Beautiful sparklers for celebrations',
      image_url: '/placeholder.svg?height=200&width=200&text=Sparklers'
    },
    {
      id: '2',
      name: 'Rockets',
      description: 'High-flying rockets and aerial fireworks',
      image_url: '/placeholder.svg?height=200&width=200&text=Rockets'
    },
    {
      id: '3',
      name: 'Ground Spinners',
      description: 'Colorful ground spinning fireworks',
      image_url: '/placeholder.svg?height=200&width=200&text=Ground+Spinners'
    },
    {
      id: '4',
      name: 'Flower Pots',
      description: 'Traditional flower pot crackers',
      image_url: '/placeholder.svg?height=200&width=200&text=Flower+Pots'
    },
    {
      id: '5',
      name: 'Bombs',
      description: 'Sound crackers and bombs',
      image_url: '/placeholder.svg?height=200&width=200&text=Bombs'
    },
    {
      id: '6',
      name: 'Gift Boxes',
      description: 'Assorted cracker gift boxes',
      image_url: '/placeholder.svg?height=200&width=200&text=Gift+Boxes'
    }
  ]
}
