'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
  overview: {
    totalProducts: number
    activeProducts: number
    totalOrders: number
    totalRevenue: number
    totalCustomers: number
    lowStockCount: number
    expiringBatches: number
  }
  trends: {
    recentOrderCount: number
    recentRevenue: number
    periodDays: number
  }
  recentOrders: any[]
  statusBreakdown: Record<string, number>
  topCategories: any[]
  lowStockProducts: any[]
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        const data = await res.json()
        setStats(data.data)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!stats) return <p className="p-6 text-gray-500">Failed to load dashboard</p>

  const statCards = [
    {
      title: 'Total Revenue',
      value: `Rs. ${(stats.overview.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: `+${stats.trends.recentRevenue.toLocaleString()} last ${stats.trends.periodDays}d`,
      up: true,
    },
    {
      title: 'Orders',
      value: stats.overview.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      trend: `${stats.trends.recentOrderCount} last ${stats.trends.periodDays}d`,
      up: true,
    },
    {
      title: 'Products',
      value: stats.overview.activeProducts.toLocaleString(),
      icon: Package,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      trend: `${stats.overview.totalProducts} total`,
      up: true,
    },
    {
      title: 'Customers',
      value: stats.overview.totalCustomers.toLocaleString(),
      icon: Users,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
      trend: 'Active users',
      up: true,
    },
  ]

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-0.5">
                        {stat.up ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                        {stat.trend}
                      </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Alerts */}
      {stats.overview.lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {stats.overview.lowStockCount} products are low on stock
            </p>
            <p className="text-xs text-amber-600">Consider restocking soon</p>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {stats.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customer?.name || 'Customer'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        Rs. {order.total.toLocaleString()}
                      </p>
                      <Badge className={`text-[10px] ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Breakdown & Top Categories */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge className={`text-xs ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
                      {status}
                    </Badge>
                    <span className="text-sm font-semibold">{count as number}</span>
                  </div>
                ))}
                {Object.keys(stats.statusBreakdown || {}).length === 0 && (
                  <p className="text-xs text-gray-400 text-center">No data</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(stats.topCategories || []).map((cat: any) => (
                  <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">{cat.name}</span>
                    <span className="text-xs font-semibold text-gray-500">{cat._count?.products || 0} items</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
