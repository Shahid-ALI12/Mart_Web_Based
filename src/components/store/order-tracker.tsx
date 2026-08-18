'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  CheckCircle, Circle, Truck, Package, ShoppingCart, Clock, MapPin, Hash, Phone, Bike, ArrowLeft,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/app-store'

interface OrderData {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  confirmedAt?: string
  processingAt?: string
  outForDeliveryAt?: string
  deliveredAt?: string
  total: number
  customer?: { name: string; phone?: string; address?: string }
  items?: { name: string; quantity: number; price: number }[]
}

interface DeliveryData {
  id: string
  riderId?: string
  riderName?: string
  status: string
  otp?: string
  estimatedMinutes?: number
}

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: ShoppingCart },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
]

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    PENDING: 0, CONFIRMED: 1, PROCESSING: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4,
  }
  return map[status] ?? 0
}

interface OrderTrackerProps {
  orderId: string
  onBack?: () => void
}

export default function OrderTracker({ orderId, onBack }: OrderTrackerProps) {
  const [order, setOrder] = useState<OrderData | null>(null)
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [orderRes, deliveryRes] = await Promise.all([
        fetch(`/api/orders/${orderId}`),
        fetch(`/api/delivery?orderId=${orderId}`),
      ])
      const orderData = await orderRes.json()
      setOrder(orderData.data || orderData)

      const deliveryData = await deliveryRes.json()
      const deliveries = deliveryData.data || []
      if (Array.isArray(deliveries) && deliveries.length > 0) {
        setDelivery(deliveries[0])
      } else if (deliveries.id) {
        setDelivery(deliveries)
      } else {
        setDelivery(null)
      }
    } catch {
      toast({ title: 'Failed to load order tracking', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto p-4 text-center">
        <p className="text-gray-500">Order not found</p>
        {onBack && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Go Back
          </Button>
        )}
      </div>
    )
  }

  const currentStep = getStepIndex(order.status)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900">Track Order</h2>
          <p className="text-sm text-gray-500">{order.orderNumber}</p>
        </div>
        <Badge className={`text-xs ${
          order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
          order.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {order.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {/* Timeline */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Timeline</h3>
          <div className="space-y-0">
            {ORDER_STEPS.map((step, i) => {
              const isCompleted = i <= currentStep
              const isCurrent = i === currentStep
              const StepIcon = step.icon
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3"
                >
                  {/* Vertical line + dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    {i < ORDER_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  {/* Label */}
                  <div className="pt-1.5 pb-4">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-green-600 mt-0.5">Current status</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Info (when OUT_FOR_DELIVERY) */}
      {order.status === 'OUT_FOR_DELIVERY' && delivery && (
        <Card className="border-0 shadow-sm border-l-4 border-l-orange-400">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-500" /> Delivery Details
            </h3>
            {delivery.riderName && (
              <div className="flex items-center gap-2 text-sm">
                <Bike className="w-4 h-4 text-green-600" />
                <span className="font-medium">{delivery.riderName}</span>
              </div>
            )}
            {delivery.otp && (
              <div className="bg-amber-50 rounded-lg p-3 text-center border border-amber-100">
                <p className="text-xs text-amber-600 mb-1">Share this OTP with the rider</p>
                <p className="text-3xl font-bold text-amber-700 tracking-widest">{delivery.otp}</p>
              </div>
            )}
            {delivery.estimatedMinutes && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Estimated: ~{delivery.estimatedMinutes} minutes
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Order Details</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order Date</span>
            <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-green-700">Rs. {order.total.toLocaleString()}</span>
          </div>
          {order.items && order.items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{item.name} × {item.quantity}</span>
                    <span className="font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Info */}
      {order.customer && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Delivery Address</h3>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{order.customer.address || 'Address on file'}</span>
            </div>
            {order.customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                {order.customer.phone}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
