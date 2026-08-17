'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Truck,
  CreditCard,
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  fulfillmentType: string
  subtotal: number
  discount: number
  tax: number
  deliveryFee: number
  total: number
  paymentMethod?: string | null
  createdAt: string
  customer?: { id: string; name: string; email: string } | null
  store?: { id: string; name: string } | null
  _count?: { items: number }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
}

export default function OrderManager() {
  const { storeId } = useAppStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchOrders()
  }, [search, statusFilter, page, storeId])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '15')
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (storeId) params.set('storeId', storeId)
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast({ title: `Order status updated to ${status}` })
      fetchOrders()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">{total} total orders</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order #..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 w-56"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Order</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="text-sm font-semibold text-green-700">{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.customer?.name || '—'}</p>
                      <p className="text-[10px] text-gray-400">{order.customer?.email || ''}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${PAYMENT_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{order._count?.items || 0}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      Rs. {order.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
