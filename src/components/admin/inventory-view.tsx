'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Package, TrendingDown, ArrowDown } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InventoryView() {
  const [stats, setStats] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, productsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/products?limit=50&isActive=true'),
        ])
        const statsData = await statsRes.json()
        const productsData = await productsRes.json()
        setStats(statsData.data)
        setProducts(productsData.data || [])
      } catch (err) {
        console.error('Failed to fetch inventory data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const lowStockProducts = stats?.lowStockProducts || []
  const overview = stats?.overview || {}

  // Sort products by stock level
  const sortedProducts = [...products].sort((a, b) => a.stockQty - b.stockQty)
  const lowStock = sortedProducts.filter(p => p.stockQty <= (p.minStockLevel || 5))
  const inStock = sortedProducts.filter(p => p.stockQty > (p.minStockLevel || 5))

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Inventory</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-xl font-bold">{overview.totalProducts || products.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Low Stock Alerts</p>
                <p className="text-xl font-bold text-red-600">{lowStockProducts.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Expiring Batches</p>
                <p className="text-xl font-bold">{overview.expiringBatches || 0}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category?.name || '—'} • SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-red-100 text-red-700">{p.stockQty} left</Badge>
                    <p className="text-[10px] text-gray-400 mt-1">Min: {p.minStockLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Products Stock Levels */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {sortedProducts.map((product) => {
              const isLow = product.stockQty <= (product.minStockLevel || 5)
              const maxStock = product.maxStockLevel || product.minStockLevel * 20 || 100
              const pct = Math.min(100, (product.stockQty / maxStock) * 100)
              return (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.sku}</p>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLow ? 'bg-red-400' : pct < 40 ? 'bg-amber-400' : 'bg-green-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold w-14 text-right ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                    {product.stockQty}
                  </span>
                  {isLow && <ArrowDown className="w-3 h-3 text-red-400" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
