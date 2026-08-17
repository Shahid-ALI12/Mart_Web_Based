'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import LoginPage from '@/components/shared/login-page'
import AppShell from '@/components/shared/app-shell'
import HeroSection from '@/components/store/hero-section'
import CategoryGrid from '@/components/store/category-grid'
import ProductGrid from '@/components/store/product-grid'
import ProductDetail from '@/components/store/product-detail'
import CartDrawer from '@/components/store/cart-drawer'
import DashboardHome from '@/components/admin/dashboard-home'
import ProductManager from '@/components/admin/product-manager'
import OrderManager from '@/components/admin/order-manager'
import InventoryView from '@/components/admin/inventory-view'
import LicenseInfo from '@/components/admin/license-info'
import PosTerminal from '@/components/pos/pos-terminal'
import RiderApp from '@/components/rider/rider-app'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutDashboard, Package, ShoppingCart, Warehouse, Shield } from 'lucide-react'

// Fetch store ID on first load
function useStoreInit() {
  const { storeId, setStoreId } = useAppStore()
  useEffect(() => {
    if (storeId) return
    async function initStore() {
      try {
        const res = await fetch('/api/categories?limit=1')
        // We'll get the store ID from the stats endpoint which has store info
        const statsRes = await fetch('/api/stats')
        const statsData = await statsRes.json()
        // Alternatively, get from first product
        const prodRes = await fetch('/api/products?limit=1')
        const prodData = await prodRes.json()
        if (prodData.data?.[0]?.storeId) {
          setStoreId(prodData.data[0].storeId)
        }
      } catch (err) {
        console.error('Failed to init store:', err)
      }
    }
    initStore()
  }, [storeId, setStoreId])
}

// Storefront View
function Storefront() {
  const { currentSubView, searchQuery } = useAppStore()

  // Product detail view
  if (currentSubView.startsWith('product-')) {
    const productId = currentSubView.replace('product-', '')
    return <ProductDetail productId={productId} />
  }

  // Category view
  if (currentSubView.startsWith('category-')) {
    const categoryId = currentSubView.replace('category-', '')
    return (
      <div>
        <HeroSection />
        <ProductGrid categoryId={categoryId} />
      </div>
    )
  }

  // Default home view
  return (
    <div>
      <HeroSection />
      <CategoryGrid />
      <ProductGrid featured title="Featured Products" />
      <ProductGrid title={searchQuery ? undefined : 'All Products'} />
    </div>
  )
}

// Admin Dashboard View
function AdminDashboard() {
  const { currentSubView, setSubView } = useAppStore()

  const activeTab = ['home', 'products', 'orders', 'inventory', 'license'].includes(currentSubView)
    ? currentSubView
    : 'home'

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setSubView} className="w-full">
        <div className="px-4 sm:px-6 pt-4">
          <TabsList className="bg-gray-100 h-9">
            <TabsTrigger value="home" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-1">
              <Package className="w-3.5 h-3.5" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs gap-1">
              <Warehouse className="w-3.5 h-3.5" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="license" className="text-xs gap-1">
              <Shield className="w-3.5 h-3.5" />
              License
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="home" className="mt-0">
          <DashboardHome />
        </TabsContent>
        <TabsContent value="products" className="mt-0">
          <ProductManager />
        </TabsContent>
        <TabsContent value="orders" className="mt-0">
          <OrderManager />
        </TabsContent>
        <TabsContent value="inventory" className="mt-0">
          <InventoryView />
        </TabsContent>
        <TabsContent value="license" className="mt-0">
          <LicenseInfo />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main App
export default function Home() {
  const { user, currentView } = useAppStore()

  // Initialize store ID
  useStoreInit()

  // Not logged in → Show Login
  if (!user) {
    return <LoginPage />
  }

  // Logged in → Show App Shell with appropriate view
  return (
    <AppShell>
      {currentView === 'store' && <Storefront />}
      {currentView === 'admin' && <AdminDashboard />}
      {currentView === 'pos' && <PosTerminal />}
      {currentView === 'rider' && <RiderApp />}

      {/* Cart Drawer (always available for store) */}
      <CartDrawer />
    </AppShell>
  )
}
