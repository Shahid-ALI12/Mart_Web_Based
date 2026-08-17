'use client'

import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateCartQty, removeFromCart, clearCart, user } = useAppStore()
  const [checkingOut, setCheckingOut] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = subtotal >= 500 ? 0 : 50
  const total = subtotal + deliveryFee

  const handleCheckout = async () => {
    if (!user) return
    setCheckingOut(true)
    try {
      const orderData = {
        customerId: user.id,
        storeId: user.storeId || '',
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        fulfillmentType: 'DELIVERY',
        paymentMethod: 'CASH',
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      clearCart()
      setCartOpen(false)
      toast({
        title: 'Order placed!',
        description: `Order ${data.data?.orderNumber || ''} created successfully`,
      })
    } catch (err: any) {
      toast({ title: 'Order failed', description: err.message, variant: 'destructive' })
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Shopping Cart
            {cart.length > 0 && (
              <Badge className="bg-green-600 text-white">{cart.length}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCartOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="w-16 h-16 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ShoppingCart className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm font-bold text-green-700 mt-0.5">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-gray-200 rounded-md bg-white">
                          <button
                            onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 rounded-l-md"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 rounded-r-md"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-gray-400 hover:text-red-500 transition-colors ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer Totals */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="font-medium">
                  {deliveryFee === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `Rs. ${deliveryFee}`
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-green-700">
                  Rs. {total.toLocaleString()}
                </span>
              </div>

              <Button
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold mt-3"
                onClick={handleCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {checkingOut ? 'Placing Order...' : `Checkout — Rs. ${total.toLocaleString()}`}
              </Button>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-gray-400 hover:text-red-500 py-1 transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
