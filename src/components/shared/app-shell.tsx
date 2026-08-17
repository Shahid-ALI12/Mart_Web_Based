'use client'

import { useAppStore, type AppView } from '@/stores/app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import NotificationCenter from '@/components/shared/notification-center'
import {
  ShoppingCart,
  Search,
  Store,
  LayoutDashboard,
  Monitor,
  Bike,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Star,
  MapPin,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const {
    user,
    currentView,
    setView,
    setSubView,
    logout,
    cart,
    cartOpen,
    setCartOpen,
    searchQuery,
    setSearchQuery,
  } = useAppStore()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const navItems: { view: AppView; label: string; icon: React.ReactNode }[] = []

  if (user?.role === 'SUPER_ADMIN' || user?.role === 'STORE_MANAGER') {
    navItems.push(
      { view: 'store', label: 'Store', icon: <Store className="w-4 h-4" /> },
      { view: 'admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { view: 'pos', label: 'POS', icon: <Monitor className="w-4 h-4" /> }
    )
  } else if (user?.role === 'CASHIER') {
    navItems.push(
      { view: 'pos', label: 'POS', icon: <Monitor className="w-4 h-4" /> }
    )
  } else if (user?.role === 'RIDER') {
    navItems.push(
      { view: 'rider', label: 'Deliveries', icon: <Bike className="w-4 h-4" /> }
    )
  } else {
    navItems.push(
      { view: 'store', label: 'Store', icon: <Store className="w-4 h-4" /> }
    )
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 hidden sm:block">
                Mega Mart
              </span>
            </div>

            {/* Desktop Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentView === item.view
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Search Bar (only for store/admin) */}
            {(currentView === 'store' || currentView === 'admin') && (
              <div className="hidden lg:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Cart (for store view) */}
              {(currentView === 'store' || navItems.some(n => n.view === 'store')) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setCartOpen(!cartOpen)}
                >
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-green-600 text-white text-[10px]">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-green-100 text-green-700 text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {user?.role}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 overflow-hidden"
            >
              <div className="p-3 space-y-1">
                {/* Mobile Search */}
                {(currentView === 'store' || currentView === 'admin') && (
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                )}
                {navItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={() => { setView(item.view); setMobileMenuOpen(false) }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentView === item.view
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav for Mobile (Customer) */}
      {user?.role === 'CUSTOMER' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
          <div className="flex items-center justify-around h-14">
            <button
              onClick={() => setView('store')}
              className={`flex flex-col items-center gap-0.5 ${currentView === 'store' ? 'text-green-600' : 'text-gray-500'}`}
            >
              <Store className="w-5 h-5" />
              <span className="text-[10px]">Store</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-gray-500">
              <Search className="w-5 h-5" />
              <span className="text-[10px]">Search</span>
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex flex-col items-center gap-0.5 text-gray-500"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 right-1/2 translate-x-3 bg-green-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="text-[10px]">Cart</span>
            </button>
            <button
              onClick={() => setSubView('loyalty')}
              className="flex flex-col items-center gap-0.5 text-gray-500"
            >
              <Star className="w-5 h-5" />
              <span className="text-[10px]">Loyalty</span>
            </button>
            <button className="flex flex-col items-center gap-0.5 text-gray-500">
              <User className="w-5 h-5" />
              <span className="text-[10px]">Account</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
