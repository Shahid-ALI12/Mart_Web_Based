'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type CartItem } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Star,
  ChevronLeft,
  Tag,
  Truck,
  ShieldCheck,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface ProductDetail {
  id: string
  name: string
  slug: string
  sku: string
  description?: string | null
  shortDesc?: string | null
  brand?: string | null
  images: string
  tags: string
  retailPrice: number
  salePrice?: number | null
  costPrice: number
  stockQty: number
  minStockLevel: number
  unit: string
  weight?: number | null
  isActive: boolean
  isFeatured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  trackInventory: boolean
  category?: { id: string; name: string; slug: string } | null
}

export default function ProductDetail({ productId }: { productId: string }) {
  const { addToCart, setSubView } = useAppStore()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`)
        const data = await res.json()
        setProduct(data.data)
      } catch (err) {
        console.error('Failed to fetch product:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Product not found</p>
        <Button variant="link" onClick={() => setSubView('home')} className="mt-2">
          Go back
        </Button>
      </div>
    )
  }

  const effectivePrice = product.salePrice ?? product.retailPrice
  const hasDiscount = product.salePrice && product.salePrice < product.retailPrice
  const discountPercent = hasDiscount
    ? Math.round(((product.retailPrice - product.salePrice!) / product.retailPrice) * 100)
    : 0

  const imageList: string[] = (() => {
    try { return JSON.parse(product.images || '[]') } catch { return [] }
  })()

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: product.id,
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      quantity: qty,
      image: imageList[0] || '',
      unit: product.unit,
      stockQty: product.stockQty,
    }
    addToCart(cartItem)
    toast({ title: 'Added to cart', description: `${product.name} × ${qty}` })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-6"
    >
      <button
        onClick={() => setSubView('home')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Store
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
          {imageList[0] ? (
            <img src={imageList[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-24 h-24 text-gray-300" />
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {product.isNewArrival && <Badge className="bg-green-600 text-white">New Arrival</Badge>}
            {product.isBestSeller && <Badge className="bg-amber-500 text-white">Best Seller</Badge>}
            {product.isFeatured && <Badge className="bg-purple-500 text-white">Featured</Badge>}
            {hasDiscount && <Badge className="bg-red-500 text-white">{discountPercent}% OFF</Badge>}
          </div>

          {product.brand && (
            <p className="text-sm text-gray-400 uppercase tracking-wide">{product.brand}</p>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>

          {product.shortDesc && (
            <p className="text-gray-600">{product.shortDesc}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-700">
              Rs. {effectivePrice.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                Rs. {product.retailPrice.toLocaleString()}
              </span>
            )}
            {product.unit !== 'piece' && (
              <span className="text-sm text-gray-500">/ {product.unit}</span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            {product.stockQty > 0 ? (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                In Stock ({product.stockQty} available)
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-50 text-red-700">
                Out of Stock
              </Badge>
            )}
          </div>

          <Separator />

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQty(Math.min(product.stockQty, qty + 1))}
                disabled={qty >= product.stockQty}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold"
              onClick={handleAddToCart}
              disabled={product.stockQty === 0}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart — Rs. {(effectivePrice * qty).toLocaleString()}
            </Button>
          </div>

          <Separator />

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'Orders above Rs. 500' },
              { icon: ShieldCheck, label: 'Quality', sub: 'Fresh guarantee' },
              { icon: Tag, label: 'Best Price', sub: 'Price match' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center p-2 rounded-lg bg-gray-50">
                <Icon className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <p className="text-xs font-medium text-gray-900">{label}</p>
                <p className="text-[10px] text-gray-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
