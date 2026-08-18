'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import {
  DollarSign, ShoppingCart, Package, Users, Truck, TrendingUp,
  AlertTriangle, BarChart3, Calendar, ArrowUpRight, Clock, Bike,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ReportData {
  summary?: Record<string, number | string>
  dailyRevenue?: { date: string; revenue: number; orders: number }[]
  topProducts?: { name: string; soldQty: number; revenue: number; margin?: number }[]
  lowStock?: { name: string; stockQty: number; minStock: number }[]
  topCustomers?: { name: string; orders: number; totalSpend: number }[]
  riderPerformance?: { name: string; trips: number; avgTime: number; onTimeRate: number }[]
  [key: string]: any
}

export default function ReportsView() {
  const [activeTab, setActiveTab] = useState('sales')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('type', activeTab)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const res = await fetch(`/api/reports?${params}`)
      const result = await res.json()
      setData(result.data || result)
    } catch {
      toast({ title: 'Failed to load report', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const fmt = (n: number) => n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-32 text-xs" />
            <span>to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-32 text-xs" />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="sales" className="gap-1 text-xs"><DollarSign className="w-3.5 h-3.5" /> Sales</TabsTrigger>
          <TabsTrigger value="products" className="gap-1 text-xs"><Package className="w-3.5 h-3.5" /> Products</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1 text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Inventory</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1 text-xs"><Users className="w-3.5 h-3.5" /> Customers</TabsTrigger>
          <TabsTrigger value="delivery" className="gap-1 text-xs"><Truck className="w-3.5 h-3.5" /> Delivery</TabsTrigger>
        </TabsList>

        {/* ── Sales Tab ── */}
        <TabsContent value="sales" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-lg" />)}</div>
              <Skeleton className="h-64 rounded-lg" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-500">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">Rs. {fmt(data?.summary?.totalRevenue as number || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-500">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{fmt(data?.summary?.totalOrders as number || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-500">Avg Order Value</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">Rs. {fmt(data?.summary?.avgOrder as number || 0)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bar Chart */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-600" /> Daily Revenue (Last 14 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {data?.dailyRevenue && data.dailyRevenue.length > 0 ? (
                    <div className="space-y-0">
                      <div className="flex items-end gap-1 h-48">
                        {data.dailyRevenue.slice(-14).map((day, i) => {
                          const maxRev = Math.max(...data.dailyRevenue!.slice(-14).map(d => d.revenue), 1)
                          const pct = (day.revenue / maxRev) * 100
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-full relative group">
                                <div
                                  className="w-full bg-green-500 rounded-t-sm hover:bg-green-600 transition-colors cursor-pointer min-h-[4px]"
                                  style={{ height: `${Math.max(pct, 2)}%` }}
                                />
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                                  Rs. {fmt(day.revenue)}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {data.dailyRevenue.slice(-14).map((day, i) => (
                          <div key={i} className="flex-1 text-center">
                            <span className="text-[9px] text-gray-400">
                              {new Date(day.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Products Tab ── */}
        <TabsContent value="products" className="mt-4">
          {loading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" /> Top 10 Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs text-right">Sold Qty</TableHead>
                      <TableHead className="text-xs text-right">Revenue</TableHead>
                      <TableHead className="text-xs text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.topProducts || []).map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{p.name}</TableCell>
                        <TableCell className="text-sm text-right">{p.soldQty}</TableCell>
                        <TableCell className="text-sm text-right font-medium">Rs. {fmt(p.revenue)}</TableCell>
                        <TableCell className="text-sm text-right">
                          <span className={p.margin && p.margin > 20 ? 'text-green-600' : 'text-orange-600'}>
                            {p.margin?.toFixed(1) || '—'}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.topProducts || data.topProducts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-gray-400 py-8">No product data</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Inventory Tab ── */}
        <TabsContent value="inventory" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-lg" />)}</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1"><Package className="w-4 h-4 text-green-600" /><span className="text-xs text-gray-500">Total Products</span></div>
                    <p className="text-2xl font-bold text-gray-900">{fmt(data?.summary?.totalProducts as number || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-xs text-gray-500">Low Stock</span></div>
                    <p className="text-2xl font-bold text-orange-600">{fmt(data?.summary?.lowStock as number || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-gray-500">Out of Stock</span></div>
                    <p className="text-2xl font-bold text-red-600">{fmt(data?.summary?.outOfStock as number || 0)}</p>
                  </CardContent>
                </Card>
              </div>
              {data?.lowStock && data.lowStock.length > 0 && (
                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" /> Low Stock Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-xs">Product</TableHead>
                          <TableHead className="text-xs text-right">Current Stock</TableHead>
                          <TableHead className="text-xs text-right">Min Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.lowStock.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{p.name}</TableCell>
                            <TableCell className="text-sm text-right text-red-600 font-medium">{p.stockQty}</TableCell>
                            <TableCell className="text-sm text-right text-gray-500">{p.minStock}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Customers Tab ── */}
        <TabsContent value="customers" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 rounded" />)}</div>
          ) : (
            <>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-green-600" /><span className="text-xs text-gray-500">Total Customers</span></div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(data?.summary?.totalCustomers as number || 0)}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" /> Top 10 Customers by Spend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs text-right">Orders</TableHead>
                        <TableHead className="text-xs text-right">Total Spend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.topCustomers || []).map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">{c.name}</TableCell>
                          <TableCell className="text-sm text-right">{c.orders}</TableCell>
                          <TableCell className="text-sm text-right font-medium text-green-700">Rs. {fmt(c.totalSpend)}</TableCell>
                        </TableRow>
                      ))}
                      {(!data?.topCustomers || data.topCustomers.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-gray-400 py-8">No customer data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Delivery Tab ── */}
        <TabsContent value="delivery" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">{Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-24 rounded-lg" />)}</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-green-600" /><span className="text-xs text-gray-500">Avg Delivery Time</span></div>
                    <p className="text-2xl font-bold text-gray-900">{data?.summary?.avgDeliveryTime || '—'} min</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1"><Bike className="w-4 h-4 text-green-600" /><span className="text-xs text-gray-500">On-Time Rate</span></div>
                    <p className="text-2xl font-bold text-green-700">{data?.summary?.onTimeRate || '0'}%</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bike className="w-4 h-4 text-green-600" /> Rider Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-xs">Rider</TableHead>
                        <TableHead className="text-xs text-right">Trips</TableHead>
                        <TableHead className="text-xs text-right">Avg Time</TableHead>
                        <TableHead className="text-xs text-right">On-Time %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.riderPerformance || []).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm font-medium">{r.name}</TableCell>
                          <TableCell className="text-sm text-right">{r.trips}</TableCell>
                          <TableCell className="text-sm text-right">{r.avgTime} min</TableCell>
                          <TableCell className="text-sm text-right">
                            <span className={r.onTimeRate >= 90 ? 'text-green-600' : 'text-orange-600'}>
                              {r.onTimeRate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!data?.riderPerformance || data.riderPerformance.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-gray-400 py-8">No rider data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
