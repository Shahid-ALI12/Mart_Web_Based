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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  sku: string
  brand?: string | null
  retailPrice: number
  salePrice?: number | null
  stockQty: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  category?: { id: string; name: string } | null
}

export default function ProductManager() {
  const { storeId } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [search, page, storeId])

  async function fetchProducts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '15')
      params.set('page', page.toString())
      if (search) params.set('search', search)
      if (storeId) params.set('storeId', storeId)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleProductStatus(product: Product) {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast({ title: `Product ${!product.isActive ? 'activated' : 'deactivated'}` })
      fetchProducts()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500">{total} total products</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 w-64"
            />
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
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
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-right">Price</TableHead>
                  <TableHead className="font-semibold text-right">Stock</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">{product.name}</p>
                          {product.brand && <p className="text-[10px] text-gray-400">{product.brand}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">{product.sku}</TableCell>
                    <TableCell className="text-sm text-gray-600">{product.category?.name || '—'}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-sm">Rs. {product.retailPrice.toLocaleString()}</span>
                      {product.salePrice && (
                        <span className="text-xs text-red-500 ml-1">-{Math.round(((product.retailPrice - product.salePrice) / product.retailPrice) * 100)}%</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-medium ${product.stockQty <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stockQty}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] cursor-pointer ${product.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                        onClick={() => toggleProductStatus(product)}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
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

      {/* Add Product Dialog Placeholder */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input placeholder="e.g. Fresh Milk 1L" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input placeholder="PRD-001" />
              </div>
              <div className="space-y-2">
                <Label>Retail Price</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Full product creation with all fields is available via API.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setShowAdd(false); toast({ title: 'Feature coming soon' }) }}>Create Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
