'use client'

import { create } from 'zustand'

export type AppView = 'store' | 'admin' | 'pos' | 'rider' | 'login'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  unit: string
  stockQty: number
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string | null
  avatar?: string | null
  role: string
  isActive: boolean
  storeId?: string | null
  lastLoginAt?: string | null
}

interface AppState {
  // Navigation
  currentView: AppView
  currentSubView: string
  setView: (view: AppView) => void
  setSubView: (subView: string) => void

  // Auth
  user: User | null
  isLoadingAuth: boolean
  login: (user: User) => void
  logout: () => void

  // Cart
  cart: CartItem[]
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQty: (productId: string, quantity: number) => void
  clearCart: () => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Store ID (from seeded data)
  storeId: string
  setStoreId: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'login',
  currentSubView: 'home',
  setView: (view) => set({ currentView: view, currentSubView: 'home' }),
  setSubView: (subView) => set({ currentSubView: subView }),

  // Auth
  user: null,
  isLoadingAuth: false,
  login: (user) => {
    let view: AppView = 'store'
    if (user.role === 'SUPER_ADMIN' || user.role === 'STORE_MANAGER') view = 'admin'
    else if (user.role === 'CASHIER') view = 'pos'
    else if (user.role === 'RIDER') view = 'rider'
    else view = 'store'
    set({ user, currentView: view, currentSubView: 'home' })
  },
  logout: () => set({ user: null, currentView: 'login', currentSubView: 'home', cart: [] }),

  // Cart
  cart: [],
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),
  addToCart: (item) => {
    const { cart } = get()
    const existing = cart.find((c) => c.productId === item.productId)
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.productId === item.productId
            ? { ...c, quantity: c.quantity + item.quantity }
            : c
        ),
      })
    } else {
      set({ cart: [...cart, item] })
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((c) => c.productId !== productId) })
  },
  updateCartQty: (productId, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter((c) => c.productId !== productId) })
    } else {
      set({
        cart: get().cart.map((c) =>
          c.productId === productId ? { ...c, quantity } : c
        ),
      })
    }
  },
  clearCart: () => set({ cart: [] }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Store ID
  storeId: '',
  setStoreId: (id) => set({ storeId: id }),
}))
