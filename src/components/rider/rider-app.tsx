'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  Bike, Package, MapPin, Phone, CheckCircle, Clock, Navigation,
  Truck, AlertCircle, DollarSign, Route, Hash, ChevronRight,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface DeliveryTrip {
  id: string
  orderId: string
  orderNumber?: string
  riderId: string
  status: string
  otp?: string
  pickupAt?: string
  deliveredAt?: string
  estimatedMinutes?: number
  createdAt: string
  deliveryFee?: number
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  items?: string[]
  orderTotal?: number
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
  ASSIGNED: { color: 'bg-yellow-100 text-yellow-700', label: 'Assigned', icon: Clock },
  PICKED_UP: { color: 'bg-blue-100 text-blue-700', label: 'Picked Up', icon: Package },
  ON_THE_WAY: { color: 'bg-orange-100 text-orange-700', label: 'On the Way', icon: Truck },
  DELIVERED: { color: 'bg-green-100 text-green-700', label: 'Delivered', icon: CheckCircle },
  FAILED: { color: 'bg-red-100 text-red-700', label: 'Failed', icon: AlertCircle },
}

export default function RiderApp() {
  const { user } = useAppStore()
  const [activeTrips, setActiveTrips] = useState<DeliveryTrip[]>([])
  const [completedTrips, setCompletedTrips] = useState<DeliveryTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  const fetchTrips = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/delivery?riderId=${user.id}`)
      const data = await res.json()
      const trips: DeliveryTrip[] = data.data || []
      setActiveTrips(trips.filter(t => t.status !== 'DELIVERED' && t.status !== 'FAILED'))
      setCompletedTrips(trips.filter(t => t.status === 'DELIVERED' || t.status === 'FAILED'))
    } catch {
      toast({ title: 'Failed to fetch deliveries', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchTrips()
    const interval = setInterval(fetchTrips, 30000)
    return () => clearInterval(interval)
  }, [fetchTrips])

  const updateTripStatus = async (tripId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/delivery/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast({ title: `Status updated to ${newStatus.replace('_', ' ')}` })
      fetchTrips()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  // Earnings calculation
  const todayCompleted = completedTrips.filter(t => {
    if (!t.deliveredAt) return false
    const delivered = new Date(t.deliveredAt)
    const now = new Date()
    return delivered.toDateString() === now.toDateString()
  })
  const todayEarnings = todayCompleted.reduce((sum, t) => sum + (t.deliveryFee || 0), 0)
  const totalEarnings = completedTrips.reduce((sum, t) => sum + (t.deliveryFee || 0), 0)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Rider Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center">
          <Bike className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Delivery Dashboard</h2>
          <p className="text-sm text-gray-500">{user?.name}</p>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Today&apos;s Earnings</span>
            </div>
            <p className="text-xl font-bold text-green-700">Rs. {todayEarnings.toLocaleString()}</p>
            <p className="text-xs text-green-600">{todayCompleted.length} trips</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">Total Trips</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{completedTrips.length}</p>
            <p className="text-xs text-gray-500">Rs. {totalEarnings.toLocaleString()} earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full bg-gray-100">
          <TabsTrigger value="active" className="gap-1 text-xs flex-1">
            <Truck className="w-3.5 h-3.5" /> Active ({activeTrips.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1 text-xs flex-1">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </TabsTrigger>
        </TabsList>

        {/* Active Deliveries */}
        <TabsContent value="active" className="mt-3 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : activeTrips.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Bike className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No active deliveries</p>
                <p className="text-xs text-gray-400 mt-1">New assignments will appear here</p>
              </CardContent>
            </Card>
          ) : (
            activeTrips.map((trip, i) => {
              const config = STATUS_CONFIG[trip.status] || STATUS_CONFIG.ASSIGNED
              const StatusIcon = config.icon
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-green-700">{trip.orderNumber || trip.orderId?.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(trip.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={`text-xs ${config.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                        {trip.customerName && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">{trip.customerName}</span>
                          </div>
                        )}
                        {trip.customerPhone && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            {trip.customerPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {trip.customerAddress || 'Delivery address'}
                        </div>
                        {trip.items && trip.items.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Hash className="w-3 h-3" />
                            {trip.items.length} item(s)
                          </div>
                        )}
                      </div>

                      {/* OTP */}
                      {trip.otp && (trip.status === 'ON_THE_WAY' || trip.status === 'PICKED_UP') && (
                        <div className="mb-3 p-2 bg-amber-50 rounded-lg text-center border border-amber-100">
                          <p className="text-xs text-amber-600">Delivery OTP — Share with customer</p>
                          <p className="text-2xl font-bold text-amber-700 tracking-widest mt-0.5">{trip.otp}</p>
                        </div>
                      )}

                      {/* Total & Actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">Rs. {(trip.orderTotal || 0).toLocaleString()}</span>
                        <div className="flex gap-2">
                          {trip.status === 'ASSIGNED' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => updateTripStatus(trip.id, 'PICKED_UP')}
                            >
                              <Package className="w-3.5 h-3.5 mr-1" />
                              Pick Up
                            </Button>
                          )}
                          {trip.status === 'PICKED_UP' && (
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => updateTripStatus(trip.id, 'ON_THE_WAY')}
                            >
                              <Navigation className="w-3.5 h-3.5 mr-1" />
                              On the Way
                            </Button>
                          )}
                          {trip.status === 'ON_THE_WAY' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateTripStatus(trip.id, 'DELIVERED')}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Delivered
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })
          )}
        </TabsContent>

        {/* Completed Deliveries */}
        <TabsContent value="completed" className="mt-3 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : completedTrips.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No completed deliveries yet</p>
              </CardContent>
            </Card>
          ) : (
            completedTrips.map((trip, i) => {
              const config = STATUS_CONFIG[trip.status] || STATUS_CONFIG.DELIVERED
              const StatusIcon = config.icon
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{trip.orderNumber || trip.orderId?.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500">
                            {trip.deliveredAt ? new Date(trip.deliveredAt).toLocaleString() : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${config.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <p className="text-xs font-semibold text-green-600 mt-1">
                            +Rs. {(trip.deliveryFee || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
