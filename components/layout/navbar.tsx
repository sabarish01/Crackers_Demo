"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/lib/cart'
import { Sparkles, Menu, ShoppingCart, User, LogOut, Home, Package, Phone } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { customer, logout } = useAuth()
  const { itemCount } = useCart()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/contact', label: 'Contact', icon: Phone },
  ];

  // Add My Orders tab for logged-in customers
  const customerNavItems = customer
    ? [
        ...navItems,
        { href: '/orders', label: 'My Orders', icon: Package },
      ]
    : navItems;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-orange-800">CrackersHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {customerNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 hover:text-orange-600 transition-colors duration-200 flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side - Cart and Auth */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            {customer && (
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-600">
                      {itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* Auth Buttons */}
            {customer ? (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/profile">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {customer.name}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Navigation Links */}
                  {customerNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}

                  {customer && (
                    <Link
                      href="/cart"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Cart
                      {itemCount > 0 && (
                        <Badge className="bg-orange-600">
                          {itemCount}
                        </Badge>
                      )}
                    </Link>
                  )}

                  <div className="border-t pt-4 mt-4">
                    {customer ? (
                      <div className="space-y-4">
                        <Link
                          href="/profile"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-orange-600 transition-colors"
                        >
                          <User className="h-5 w-5" />
                          Profile ({customer.name})
                        </Link>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleLogout()
                            setIsOpen(false)
                          }}
                          className="flex items-center gap-3 text-lg font-medium text-red-600 hover:text-red-700 w-full justify-start p-0"
                        >
                          <LogOut className="h-5 w-5" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Link
                          href="/login"
                          onClick={() => setIsOpen(false)}
                        >
                          <Button variant="ghost" className="w-full justify-start text-lg">
                            Login
                          </Button>
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setIsOpen(false)}
                        >
                          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-lg">
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
