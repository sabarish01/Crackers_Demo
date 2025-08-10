"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// ...existing code...
import { formatCurrency } from '@/lib/utils'
// Removed direct MySQL connection; all data access via API endpoints
import AdminLayout from '@/components/admin/admin-layout'
import { ShoppingCart, Package, Users, DollarSign, TrendingUp, Clock } from 'lucide-react'

interface DashboardStats {
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue: number
  recentOrders: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch orders stats
      const ordersRes = await fetch('/api/orders')
      const orders = ordersRes.ok ? await ordersRes.json() : []
      const pendingRes = await fetch('/api/orders?status=Pending')
      const pendingOrders = pendingRes.ok ? await pendingRes.json() : []
      // Fetch products count
      const productsRes = await fetch('/api/products')
      const products = productsRes.ok ? await productsRes.json() : []
      // Fetch customers count
      const customersRes = await fetch('/api/customers')
      const customers = customersRes.ok ? await customersRes.json() : []
      // Fetch recent orders with customer name
      const recentRes = await fetch('/api/orders?includeCustomer=true&sort=created_at_desc&limit=5')
      const recentOrders = recentRes.ok ? await recentRes.json() : []
      // Count all orders and revenue
      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.final_amount || 0), 0)
      setStats({
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalRevenue,
        recentOrders: recentOrders.map((order: any) => ({ ...order, customers: { name: order.customer_name } }))
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="text-center">Loading dashboard...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingOrders} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                Active products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                All time revenue
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">
                      {order.customers?.name || 'Unknown Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(order.final_amount)}</p>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
