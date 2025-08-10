"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles, Star, Zap } from 'lucide-react'

const heroImages = [
  '/diwali-fireworks.png',
  '/colorful-crackers-display.png',
  '/placeholder-if1ox.png'
]

export default function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImage ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center mb-6">
          <Sparkles className="h-12 w-12 text-yellow-400 sparkle-animation mr-4" />
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              CrackersHub
            </span>
          </h1>
          <Sparkles className="h-12 w-12 text-yellow-400 sparkle-animation ml-4" />
        </div>
        
        <p className="text-xl sm:text-2xl lg:text-3xl mb-8 max-w-4xl mx-auto">
          Light up your celebrations with premium quality crackers and fireworks
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 text-lg glow-animation">
            <Link href="/products">
              <Star className="mr-2 h-5 w-5" />
              Shop Now
            </Link>
          </Button>
          {/* Make Gift Boxes button same style as Shop Now */}
          <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 text-lg glow-animation">
            <Link href="/products?category=97EE3AF7-37D7-4E76-AED8-3B9FBE9E20E1">
              <Zap className="mr-2 h-5 w-5" />
              Gift Boxes
            </Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <Sparkles className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Premium Quality</h3>
            <p className="text-sm opacity-90">Certified safe and high-quality crackers</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <Star className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Fast Delivery</h3>
            <p className="text-sm opacity-90">Quick and secure delivery to your doorstep</p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6">
            <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Best Prices</h3>
            <p className="text-sm opacity-90">Competitive prices with amazing offers</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
