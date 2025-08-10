"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
// Removed direct MySQL connection; all data access via API endpoints
// ...existing code...
import { useAuth } from '@/contexts/auth-context'

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    image_url: string
    stock_quantity: number
  }
}

interface CartContextType {
  items: CartItem[]
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  total: number
  itemCount: number
  loading: boolean
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const { customer } = useAuth()

  useEffect(() => {
    if (customer) {
      refreshCart()
    } else {
      setItems([])
    }
  }, [customer])

  const refreshCart = async () => {
    if (!customer) return

    setLoading(true)
    try {
      const res = await fetch(`/api/cart?customer_id=${customer.id}`)
      if (!res.ok) {
        throw new Error('Failed to load cart')
      }
      const items = await res.json()
      setItems(items)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (productId: string, quantity: number = 1) => {
    if (!customer) {
      throw new Error('Must be logged in to add items to cart')
    }

    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customer.id, product_id: productId, quantity })
      })
      if (!res.ok) throw new Error('Error adding item to cart')
      await refreshCart()
    } catch (error) {
      console.error('Error adding item to cart:', error)
      throw error
    }
  }

  const removeItem = async (cartItemId: string) => {
    try {
      const res = await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error removing item from cart')
      await refreshCart()
    } catch (error) {
      console.error('Error removing item from cart:', error)
      throw error
    }
  }

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(cartItemId)
      return
    }
    try {
      const res = await fetch(`/api/cart?id=${cartItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity })
      })
      if (!res.ok) throw new Error('Error updating cart item quantity')
      await refreshCart()
    } catch (error) {
      console.error('Error updating cart item quantity:', error)
      throw error
    }
  }

  const clearCart = async () => {
    if (!customer) return

    try {
      const res = await fetch(`/api/cart?customer_id=${customer.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error clearing cart')
      setItems([])
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }

  const total = items.reduce((sum, item) => sum + (item.products.price * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        loading,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
