'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Search, ArrowRight, Sparkles, Truck, ShieldCheck, Leaf } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/app-store'

export default function HeroSection() {
  const { setSearchQuery, setView } = useAppStore()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-600">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Fresh groceries delivered in 30 min
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Everything You Need,{' '}
              <span className="text-green-200">Delivered Fresh</span>
            </h1>
            <p className="mt-4 text-green-100 text-base sm:text-lg max-w-lg mx-auto lg:mx-0">
              From farm-fresh produce to daily essentials — shop 5000+ products and get them delivered to your doorstep.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for groceries..."
                  className="pl-10 h-11 bg-white border-0 shadow-lg"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 font-semibold shadow-lg h-11"
                onClick={() => setView('store')}
              >
                Shop Now
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Right - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:grid grid-cols-2 gap-3"
          >
            {[
              { icon: Truck, title: 'Free Delivery', desc: 'On orders above Rs. 500' },
              { icon: Leaf, title: 'Fresh Guarantee', desc: 'Farm to table in hours' },
              { icon: ShieldCheck, title: 'Secure Payment', desc: '100% safe checkout' },
              { icon: Sparkles, title: 'Best Prices', desc: 'Unbeatable deals daily' },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white border border-white/10"
                >
                  <Icon className="w-6 h-6 mb-2 text-green-200" />
                  <p className="font-semibold text-sm">{feature.title}</p>
                  <p className="text-green-200 text-xs mt-0.5">{feature.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
