"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  pincode?: string
  created_at: string
}

export interface AdminUser {
  id: string
  username: string
  role: string
  created_at: string
}

interface AuthContextType {
  customer: Customer | null
  admin: AdminUser | null
  login: (user: Customer | AdminUser) => void
  logout: () => void
  loading: boolean
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load auth state from localStorage
    const savedCustomer = localStorage.getItem('customer')
    const savedAdmin = localStorage.getItem('admin')
    
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer))
      } catch (error) {
        console.error('Error parsing saved customer:', error)
        localStorage.removeItem('customer')
      }
    }
    
    if (savedAdmin) {
      try {
        setAdmin(JSON.parse(savedAdmin))
      } catch (error) {
        console.error('Error parsing saved admin:', error)
        localStorage.removeItem('admin')
      }
    }
    
    setLoading(false)
  }, [])

  const login = (user: Customer | AdminUser) => {
    if ('phone' in user) {
      // It's a customer
      setCustomer(user as Customer)
      setAdmin(null)
      localStorage.setItem('customer', JSON.stringify(user))
      localStorage.removeItem('admin')
    } else {
      // It's an admin
      setAdmin(user as AdminUser)
      setCustomer(null)
      localStorage.setItem('admin', JSON.stringify(user))
      localStorage.removeItem('customer')
    }
  }

  const logout = () => {
    setCustomer(null)
    setAdmin(null)
    localStorage.removeItem('customer')
    localStorage.removeItem('admin')
  }

  return (
    <AuthContext.Provider
      value={{
        customer,
        admin,
        login,
        logout,
        loading,
        setCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
