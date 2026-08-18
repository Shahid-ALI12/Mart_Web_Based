'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { ErrorBoundary, LightweightErrorBoundary } from '@/components/shared/error-boundary'
import LoginPage from '@/components/shared/login-page'
import AppShell from '@/components/shared/app-shell'
import NotificationCenter from '@/components/shared/notification-center'
import HeroSection from '@/components/store/hero-section'
import CategoryGrid from '@/components/store/category-grid'
import ProductGrid from '@/components/store/product-grid'
import ProductDetail from '@/components/store/product-detail'
import CartDrawer from '@/components/store/cart-drawer'
import OrderTracker from '@/components/store/order-tracker'
import LoyaltyPanel from '@/components/store/loyalty-panel'
import DashboardHome from '@/components/admin/dashboard-home'
import ProductManager from '@/components/admin/product-manager'
import OrderManager from '@/components/admin/order-manager'
import InventoryView from '@/components/admin/inventory-view'
import LicenseInfo from '@/components/admin/license-info'
import DeliveryManager from '@/components/admin/delivery-manager'
import ReportsView from '@/components/admin/reports-view'
import PromotionsManager from '@/components/admin/promotions-manager'
import SupplierManager from '@/components/admin/supplier-manager'
import PosTerminal from '@/components/pos/pos-terminal'
import RiderApp from '@/components/rider/rider-app'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Shield,
  Truck, BarChart3, Tag, Building2, Star, MapPin, ArrowLeft,
} from 'lucide-react'

// Fetch store ID on first load
function useStoreInit() {
  const { storeId, setStoreId } = useAppStore()
  useEffect(() => {
    if (storeId) return
    async function initStore() {
      try {
        const res = await fetch('/api/categories?limit=1')
        const statsRes = await fetch('/api/stats')
        const statsData = await statsRes.json()
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
  const { currentSubView, searchQuery, setSubView } = useAppStore()

  // Order tracker view
  if (currentSubView.startsWith('order-track-')) {
    const orderId = currentSubView.replace('order-track-', '')
    return (
      <LightweightErrorBoundary name="Order Tracker">
        <OrderTracker
          orderId={orderId}
          onBack={() => setSubView('home')}
        />
      </LightweightErrorBoundary>
    )
  }

  // Loyalty panel view
  if (currentSubView === 'loyalty') {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Button variant="ghost" size="sm" className="mb-3 gap-1" onClick={() => setSubView('home')}>
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Button>
        <LightweightErrorBoundary name="Loyalty">
          <LoyaltyPanel />
        </LightweightErrorBoundary>
      </div>
    )
  }

  // Product detail view
  if (currentSubView.startsWith('product-')) {
    const productId = currentSubView.replace('product-', '')
    return (
      <LightweightErrorBoundary name="Product Detail">
        <ProductDetail productId={productId} />
      </LightweightErrorBoundary>
    )
  }

  // Category view
  if (currentSubView.startsWith('category-')) {
    const categoryId = currentSubView.replace('category-', '')
    return (
      <div>
        <HeroSection />
        <LightweightErrorBoundary name="Category Products">
          <ProductGrid categoryId={categoryId} />
        </LightweightErrorBoundary>
      </div>
    )
  }

  // Default home view
  return (
    <div>
      <HeroSection />
      <LightweightErrorBoundary name="Categories">
        <CategoryGrid />
      </LightweightErrorBoundary>
      <LightweightErrorBoundary name="Featured Products">
        <ProductGrid featured title="Featured Products" />
      </LightweightErrorBoundary>
      <LightweightErrorBoundary name="All Products">
        <ProductGrid title={searchQuery ? undefined : 'All Products'} />
      </LightweightErrorBoundary>
    </div>
  )
}

// Admin Dashboard View
function AdminDashboard() {
  const { currentSubView, setSubView } = useAppStore()

  const validTabs = ['home', 'products', 'orders', 'inventory', 'license', 'delivery', 'reports', 'promotions', 'suppliers']
  const activeTab = validTabs.includes(currentSubView) ? currentSubView : 'home'

  return (
    <div className="max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setSubView} className="w-full">
        <div className="px-4 sm:px-6 pt-4">
          <TabsList className="bg-gray-100 h-9 flex-wrap">
            <TabsTrigger value="home" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-1">
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs gap-1">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs gap-1">
              <Warehouse className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inventory</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs gap-1">
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="promotions" className="text-xs gap-1">
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Promos</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="text-xs gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="license" className="text-xs gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">License</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="home" className="mt-0">
          <LightweightErrorBoundary name="Dashboard">
            <DashboardHome />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="products" className="mt-0">
          <LightweightErrorBoundary name="Product Manager">
            <ProductManager />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="orders" className="mt-0">
          <LightweightErrorBoundary name="Order Manager">
            <OrderManager />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="inventory" className="mt-0">
          <LightweightErrorBoundary name="Inventory">
            <InventoryView />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="delivery" className="mt-0">
          <LightweightErrorBoundary name="Delivery">
            <DeliveryManager />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="promotions" className="mt-0">
          <LightweightErrorBoundary name="Promotions">
            <PromotionsManager />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="reports" className="mt-0">
          <LightweightErrorBoundary name="Reports">
            <ReportsView />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="suppliers" className="mt-0">
          <LightweightErrorBoundary name="Suppliers">
            <SupplierManager />
          </LightweightErrorBoundary>
        </TabsContent>
        <TabsContent value="license" className="mt-0">
          <LightweightErrorBoundary name="License">
            <LicenseInfo />
          </LightweightErrorBoundary>
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

  // Logged in → Show App Shell with appropriate view (wrapped in ErrorBoundary)
  return (
    <ErrorBoundary name="Mega Mart App">
      <AppShell>
        {currentView === 'store' && <Storefront />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'pos' && (
          <LightweightErrorBoundary name="POS Terminal">
            <PosTerminal />
          </LightweightErrorBoundary>
        )}
        {currentView === 'rider' && (
          <LightweightErrorBoundary name="Rider App">
            <RiderApp />
          </LightweightErrorBoundary>
        )}

        {/* Cart Drawer (always available for store) */}
        <LightweightErrorBoundary name="Cart">
          <CartDrawer />
        </LightweightErrorBoundary>

        {/* Notification Center (always available) */}
        <LightweightErrorBoundary name="Notifications">
          <NotificationCenter />
        </LightweightErrorBoundary>
      </AppShell>
    </ErrorBoundary>
  )
}
