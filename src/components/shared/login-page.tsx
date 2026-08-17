'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/stores/app-store'
import { api } from '@/lib/api/client'
import { ShoppingCart, Mail, Lock, Loader2, User, Shield, Calculator, Bike } from 'lucide-react'
import { motion } from 'framer-motion'

const DEMO_ACCOUNTS = [
  { email: 'admin@megamart.pk', password: 'admin123', label: 'Super Admin', icon: Shield, color: 'text-red-600' },
  { email: 'manager@megamart.pk', password: 'manager123', label: 'Store Manager', icon: User, color: 'text-amber-600' },
  { email: 'cashier@megamart.pk', password: 'cashier123', label: 'Cashier (POS)', icon: Calculator, color: 'text-green-600' },
  { email: 'rider@megamart.pk', password: 'rider123', label: 'Rider', icon: Bike, color: 'text-sky-600' },
  { email: 'customer@test.com', password: 'customer123', label: 'Customer', icon: User, color: 'text-violet-600' },
]

export default function LoginPage() {
  const { login } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e?: React.FormEvent, demoEmail?: string, demoPassword?: string) => {
    e?.preventDefault()
    const loginEmail = demoEmail || email
    const loginPassword = demoPassword || password

    if (!loginEmail || !loginPassword) {
      setError('Please enter email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.login(loginEmail, loginPassword)
      login(res.user)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg shadow-green-200">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Mega Mart</h1>
          <p className="text-gray-500 mt-1">Your one-stop shopping destination</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-600 bg-red-50 p-2 rounded-md"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon
                return (
                  <button
                    key={account.email}
                    onClick={() => handleLogin(undefined, account.email, account.password)}
                    disabled={loading}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <Icon className={`w-4 h-4 ${account.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{account.label}</p>
                      <p className="text-xs text-gray-500 truncate">{account.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
