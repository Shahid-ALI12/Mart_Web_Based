'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore, type CartItem } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Loader2,
  Package,
  Receipt,
  CheckCircle,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  name: string
  sku: string
  retailPrice: number
  salePrice?: number | null
  stockQty: number
  unit: string
  brand?: string | null
}

export default function PosTerminal() {
  const { user, storeId } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [billItems, setBillItems] = useState<(CartItem & { sku: string })[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH')
  const [processing, setProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=10&isActive=true`)
        const data = await res.json()
        setSearchResults(data.data || [])
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const addToBill = (product: Product) => {
    const price = product.salePrice ?? product.retailPrice
    const existing = billItems.find((b) => b.productId === product.id)
    if (existing) {
      setBillItems(billItems.map((b) =>
        b.productId === product.id ? { ...b, quantity: b.quantity + 1, price: price } : b
      ))
    } else {
      setBillItems([...billItems, {
        id: product.id,
        productId: product.id,
        name: product.name,
        price,
        quantity: 1,
        image: '',
        unit: product.unit,
        stockQty: product.stockQty,
        sku: product.sku,
      }])
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const updateBillQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setBillItems(billItems.filter((b) => b.productId !== productId))
    } else {
      setBillItems(billItems.map((b) => b.productId === productId ? { ...b, quantity: qty } : b))
    }
  }

  const subtotal = billItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = Math.round(subtotal * 0.17 * 100) / 100
  const total = subtotal + tax

  const processPayment = async () => {
    if (!user || billItems.length === 0) return
    setProcessing(true)
    try {
      const orderData = {
        customerId: user.id,
        storeId: storeId || user.storeId || '',
        items: billItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        fulfillmentType: 'PICKUP',
        paymentMethod,
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      setLastOrder(data.data)
      setShowReceipt(true)
      setBillItems([])
      toast({ title: 'Payment processed!', description: `Order ${data.data?.orderNumber}` })
    } catch (err: any) {
      toast({ title: 'Payment failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row bg-gray-50">
      {/* Left: Product Search */}
      <div className="flex-1 p-4 space-y-4 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Scan barcode or search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-base"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
            </div>
          )}
          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-center py-8 text-gray-500">No products found</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {searchResults.map((product) => {
              const price = product.salePrice ?? product.retailPrice
              return (
                <button
                  key={product.id}
                  onClick={() => addToBill(product)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-700">Rs. {price.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">Stock: {product.stockQty}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Bill */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-green-600" />
            Current Bill
          </h3>
        </div>

        {/* Bill Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {billItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Add items to the bill</p>
            </div>
          ) : (
            <AnimatePresence>
              {billItems.map((item) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">Rs. {item.price.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-md bg-white">
                    <button onClick={() => updateBillQty(item.productId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                    <button onClick={() => updateBillQty(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold w-16 text-right">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  <button onClick={() => updateBillQty(item.productId, 0)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax (17%)</span>
              <span>Rs. {tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg text-green-700">Rs. {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex gap-2">
            <Button
              variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
              className={`flex-1 ${paymentMethod === 'CASH' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              onClick={() => setPaymentMethod('CASH')}
            >
              <Banknote className="w-4 h-4 mr-1" />
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
              className={`flex-1 ${paymentMethod === 'CARD' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              onClick={() => setPaymentMethod('CARD')}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Card
            </Button>
          </div>

          <Button
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base"
            onClick={processPayment}
            disabled={billItems.length === 0 || processing}
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {processing ? 'Processing...' : `Pay Rs. ${total.toLocaleString()}`}
          </Button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold">Payment Successful!</h3>
              <p className="text-sm text-gray-500">Order: {lastOrder.orderNumber}</p>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">Rs. {lastOrder.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment</span>
                <span>{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span>{lastOrder.items?.length || 0}</span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowReceipt(false)}>
              Done
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
