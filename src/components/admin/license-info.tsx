'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/stores/app-store'
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  Store,
  Users,
  Monitor,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function LicenseInfo() {
  const { storeId } = useAppStore()
  const [license, setLicense] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLicense() {
      if (!storeId) { setLoading(false); return }
      try {
        const res = await fetch(`/api/license?storeId=${storeId}`)
        const data = await res.json()
        setLicense(data.data)
      } catch (err) {
        console.error('Failed to fetch license:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLicense()
  }, [storeId])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (!license) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No license information available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    TRIAL: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-green-100 text-green-700',
    PAST_DUE: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
    EXPIRED: 'bg-red-100 text-red-700',
  }

  const planColors: Record<string, string> = {
    STARTER: 'bg-gray-100 text-gray-700',
    PROFESSIONAL: 'bg-green-100 text-green-700',
    ENTERPRISE: 'bg-purple-100 text-purple-700',
  }

  const features = license.features || {}

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-lg font-bold text-gray-900">License & Subscription</h2>

      {/* License Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">License</span>
                  <Badge className={`${planColors[license.plan] || 'bg-white/20 text-white'} text-xs`}>
                    {license.plan}
                  </Badge>
                </div>
                <Badge className={`${statusColors[license.status] || 'bg-white/20 text-white'} text-xs`}>
                  {license.isTrial ? 'Trial Period' : license.status}
                </Badge>
              </div>
              {license.isTrial && license.trialDaysRemaining > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold">{license.trialDaysRemaining}</p>
                  <p className="text-xs opacity-80">days remaining</p>
                </div>
              )}
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Max Stores</p>
                  <p className="text-lg font-bold">{license.maxStores}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Max Users</p>
                  <p className="text-lg font-bold">{license.maxUsers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">POS Terminals</p>
                  <p className="text-lg font-bold">{license.maxPosTerminals}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600" />
            Feature Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(features).map(([key, enabled]) => (
              <div
                key={key}
                className={`p-3 rounded-xl border ${
                  enabled ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {enabled ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-xs font-medium ${enabled ? 'text-green-700' : 'text-gray-500'}`}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">{enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      {license.subscription && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Plan</span>
                <Badge className={planColors[license.subscription.plan] || 'bg-gray-100'}>
                  {license.subscription.plan}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-semibold">
                  {license.subscription.currency} {license.subscription.amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Billing Cycle</span>
                <span className="text-sm">{license.subscription.billingCycle}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Next Billing</span>
                <span className="text-sm">
                  {new Date(license.subscription.nextBillingDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Auto Renew</span>
                <Badge className={license.subscription.autoRenew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                  {license.subscription.autoRenew ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
