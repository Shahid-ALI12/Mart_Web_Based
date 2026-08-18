'use client'

import { useEffect, useState } from 'react'
import ProductCard from './product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/stores/app-store'
import { Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  brand?: string | null
  images: string
  shortDesc?: string | null
  retailPrice: number
  salePrice?: number | null
  stockQty: number
  unit: string
  isActive: boolean
  isFeatured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  category?: { id: string; name: string; slug: string } | null
  _count?: { reviews: number }
}

interface ProductGridProps {
  categoryId?: string
  featured?: boolean
  title?: string
}

export default function ProductGrid({ categoryId, featured, title }: ProductGridProps) {
  const { storeId, searchQuery } = useAppStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', '40')
        if (storeId) params.set('storeId', storeId)
        if (searchQuery) params.set('search', searchQuery)
        if (categoryId) params.set('categoryId', categoryId)
        if (featured) params.set('isFeatured', 'true')

        const res = await fetch(`/api/products?${params.toString()}`)
        const data = await res.json()
        setProducts(data.data || [])
        setTotal(data.pagination?.total || 0)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [storeId, searchQuery, categoryId, featured])

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-6">
        {title && <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {title || (searchQuery ? `Results for "${searchQuery}"` : 'All Products')}
        </h2>
        <span className="text-sm text-gray-500">{total} items</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
