'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  Bike,
  Package,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Navigation,
  ChevronRight,
  Truck,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface DeliveryOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  customer?: { id: string; name: string; phone?: string; email: string } | null
  delivery?: {
    id: string
    status: string
    pickupAt?: string
    deliveredAt?: string
    otp?: string
  } | null
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  PENDING: { color: 'bg-amber-100 text-amber-700', label: 'Pending Pickup', icon: Clock },
  CONFIRMED: { color: 'bg-blue-100 text-blue-700', label: 'Confirmed', icon: CheckCircle },
  PROCESSING: { color: 'bg-blue-100 text-blue-700', label: 'Processing', icon: Package },
  OUT_FOR_DELIVERY: { color: 'bg-purple-100 text-purple-700', label: 'Out for Delivery', icon: Truck },
  DELIVERED: { color: 'bg-green-100 text-green-700', label: 'Delivered', icon: CheckCircle },
}

export default function RiderApp() {
  const { user, storeId } = useAppStore()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    fetchOrders()
  }, [storeId, activeTab])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '20')
      if (storeId) params.set('storeId', storeId)
      if (activeTab === 'active') {
        // Fetch orders that are out for delivery or processing
        params.set('status', 'OUT_FOR_DELIVERY')
      } else {
        params.set('status', 'DELIVERED')
      }
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.data || [])
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const markDelivered = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast({ title: 'Order marked as delivered!' })
      fetchOrders()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const pickupOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OUT_FOR_DELIVERY' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast({ title: 'Order picked up!' })
      fetchOrders()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Rider Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center">
          <Bike className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Delivery Dashboard</h2>
          <p className="text-sm text-gray-500">{user?.name} — {orders.length} orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'active' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          onClick={() => setActiveTab('active')}
        >
          <Truck className="w-3.5 h-3.5 mr-1" />
          Active
        </Button>
        <Button
          variant={activeTab === 'completed' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Completed
        </Button>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <Bike className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeTab === 'active' ? 'No active deliveries' : 'No completed deliveries'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
            const StatusIcon = config.icon
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-green-700">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={`text-xs ${config.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    {order.customer && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium">{order.customer.name}</span>
                        </div>
                        {order.customer.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            {order.customer.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          Delivery address
                        </div>
                      </div>
                    )}

                    {/* Total & Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">Rs. {order.total.toLocaleString()}</span>
                      <div className="flex gap-2">
                        {order.status === 'PROCESSING' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => pickupOrder(order.id)}
                          >
                            <Navigation className="w-3.5 h-3.5 mr-1" />
                            Pickup
                          </Button>
                        )}
                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => markDelivered(order.id)}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Delivered
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* OTP */}
                    {order.delivery?.otp && order.status === 'OUT_FOR_DELIVERY' && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-lg text-center">
                        <p className="text-xs text-amber-600">Delivery OTP</p>
                        <p className="text-2xl font-bold text-amber-700 tracking-widest">{order.delivery.otp}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
