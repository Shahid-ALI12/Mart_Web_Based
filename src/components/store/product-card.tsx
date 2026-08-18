'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Plus, Star, Package } from 'lucide-react'
import { useAppStore, type CartItem } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

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

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, setSubView } = useAppStore()

  const effectivePrice = product.salePrice ?? product.retailPrice
  const hasDiscount = product.salePrice && product.salePrice < product.retailPrice
  const discountPercent = hasDiscount
    ? Math.round(((product.retailPrice - product.salePrice!) / product.retailPrice) * 100)
    : 0

  const imageList: string[] = (() => {
    try { return JSON.parse(product.images || '[]') } catch { return [] }
  })()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    const cartItem: CartItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      quantity: 1,
      image: imageList[0] || '',
      unit: product.unit,
      stockQty: product.stockQty,
    }
    addToCart(cartItem)
    toast({ title: 'Added to cart', description: `${product.name} × 1` })
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-shadow bg-white"
        onClick={() => setSubView(`product-${product.id}`)}
      >
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {imageList[0] ? (
            <img
              src={imageList[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                -{discountPercent}%
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
            {product.isBestSeller && (
              <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">
                Best Seller
              </Badge>
            )}
            {product.isFeatured && !product.isBestSeller && (
              <Badge className="bg-purple-500 text-white text-[10px] px-1.5 py-0">
                Featured
              </Badge>
            )}
          </div>

          {/* Quick Add Button */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
              onClick={handleAddToCart}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Out of stock overlay */}
          {product.stockQty === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-3 space-y-1">
          {product.brand && (
            <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">{product.brand}</p>
          )}
          <h3 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          {product.category && (
            <p className="text-[10px] text-gray-400">{product.category.name}</p>
          )}
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-base font-bold text-green-700">
              Rs. {effectivePrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                Rs. {product.retailPrice.toLocaleString()}
              </span>
            )}
          </div>
          {product.unit && product.unit !== 'piece' && (
            <p className="text-[10px] text-gray-400">per {product.unit}</p>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
