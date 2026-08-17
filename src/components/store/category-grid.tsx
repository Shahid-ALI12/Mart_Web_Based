'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/app-store'
import { Skeleton } from '@/components/ui/skeleton'
import { useEffect, useState } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  description?: string | null
  _count?: { products: number; children: number }
}

const CATEGORY_COLORS = [
  'from-green-400 to-green-600',
  'from-emerald-400 to-emerald-600',
  'from-teal-400 to-teal-600',
  'from-lime-400 to-lime-600',
  'from-amber-400 to-amber-600',
  'from-orange-400 to-orange-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
]

export default function CategoryGrid() {
  const { storeId, setSubView, setSearchQuery } = useAppStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories' + (storeId ? `?storeId=${storeId}` : ''))
        const data = await res.json()
        // Only show top-level categories (no parentId)
        const topLevel = (data.data || []).filter((c: any) => !c.parentId)
        setCategories(topLevel)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [storeId])

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    )
  }

  if (categories.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
        {categories.map((category, i) => (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => {
              setSearchQuery('')
              setSubView(`category-${category.id}`)
            }}
            className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:shadow-md"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="relative">
              <span className="text-3xl block mb-2">{category.icon || '📦'}</span>
              <p className="font-semibold text-sm text-gray-900 truncate">{category.name}</p>
              {category._count && (
                <p className="text-xs text-gray-500 mt-0.5">{category._count.products} items</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
