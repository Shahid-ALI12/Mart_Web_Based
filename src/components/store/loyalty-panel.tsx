'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/stores/app-store'
import { toast } from '@/hooks/use-toast'
import {
  Star, Gift, Wallet, TrendingUp, Award, CheckCircle, ArrowRight, Crown, Shield, Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface LoyaltyData {
  points: number
  tier: string
  tierPoints: number
  nextTierPoints: number
  totalSpent: number
  availableRewards?: number
  benefits?: string[]
}

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  BRONZE: { color: '#CD7F32', bg: 'bg-amber-50', label: 'Bronze', icon: Shield },
  SILVER: { color: '#C0C0C0', bg: 'bg-gray-50', label: 'Silver', icon: Award },
  GOLD: { color: '#FFD700', bg: 'bg-yellow-50', label: 'Gold', icon: Crown },
  PLATINUM: { color: '#E5E4E2', bg: 'bg-slate-50', label: 'Platinum', icon: Zap },
}

const TIER_BENEFITS: Record<string, string[]> = {
  BRONZE: ['1x points on all purchases', 'Birthday bonus 50 points', 'Free delivery on orders > Rs. 2000'],
  SILVER: ['1.5x points on all purchases', 'Birthday bonus 100 points', 'Free delivery on all orders', 'Exclusive monthly deals'],
  GOLD: ['2x points on all purchases', 'Birthday bonus 200 points', 'Free delivery on all orders', 'Priority customer support', 'Early access to sales'],
  PLATINUM: ['3x points on all purchases', 'Birthday bonus 500 points', 'Free delivery on all orders', '24/7 priority support', 'Early access to sales', 'Personal shopping assistant'],
}

const TIER_THRESHOLDS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 1500,
  PLATINUM: 5000,
}

export default function LoyaltyPanel() {
  const { user } = useAppStore()
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  const fetchLoyalty = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/loyalty?userId=${user.id}`)
      const data = await res.json()
      setLoyalty(data.data || data)
    } catch {
      toast({ title: 'Failed to load loyalty data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchLoyalty() }, [fetchLoyalty])

  const handleRedeem = async () => {
    const amount = parseInt(redeemAmount)
    if (!amount || amount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' })
      return
    }
    if (loyalty && amount > loyalty.points) {
      toast({ title: 'Insufficient points', variant: 'destructive' })
      return
    }
    setRedeeming(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'redeem', points: amount }),
      })
      if (!res.ok) throw new Error('Failed to redeem')
      toast({ title: `Redeemed ${amount} points!`, description: `Rs. ${amount} added to wallet` })
      setRedeemAmount('')
      fetchLoyalty()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  const tier = loyalty?.tier || 'BRONZE'
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.BRONZE
  const TierIcon = tierConfig.icon
  const benefits = TIER_BENEFITS[tier] || TIER_BENEFITS.BRONZE
  const points = loyalty?.points || 0
  const nextTierPoints = loyalty?.nextTierPoints || TIER_THRESHOLDS.SILVER
  const currentTierPoints = TIER_THRESHOLDS[tier] || 0
  const progressPct = nextTierPoints > currentTierPoints
    ? Math.min(((points - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100, 100)
    : 100

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Star className="w-5 h-5 text-green-600" /> Loyalty Program
      </h2>

      {/* Tier Badge Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-0 shadow-sm overflow-hidden ${tierConfig.bg}`}>
          <CardContent className="p-6 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ backgroundColor: tierConfig.color + '20' }}
            >
              <TierIcon className="w-8 h-8" style={{ color: tierConfig.color }} />
            </div>
            <Badge
              className="text-sm font-bold px-4 py-1 mb-2"
              style={{ backgroundColor: tierConfig.color + '20', color: tierConfig.color, borderColor: tierConfig.color + '40' }}
              variant="outline"
            >
              {tierConfig.label} Member
            </Badge>
            <p className="text-sm text-gray-500 mt-2">
              {tier === 'PLATINUM' ? 'You\'ve reached the highest tier!' : `${nextTierPoints - points} points to next tier`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Points Balance */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Gift className="w-4 h-4" /> Points Balance
            </span>
            <span className="text-xs text-gray-400">1 point = Rs. 1</span>
          </div>
          <p className="text-4xl font-bold text-green-700">{points.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Total spent: Rs. {(loyalty?.totalSpent || 0).toLocaleString()}</p>

          {/* Tier Progress */}
          {tier !== 'PLATINUM' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{tierConfig.label}</span>
                <span>{Object.entries(TIER_THRESHOLDS).find(([k, v]) => v === nextTierPoints)?.[0] || 'Next'}</span>
              </div>
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-gray-400 mt-1 text-center">{Math.round(progressPct)}% to next tier</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redeem Points */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" /> Redeem Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">Convert points to wallet balance at 1:1 rate</p>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Points to redeem"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              min={1}
              max={points}
            />
            <Button
              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
              disabled={!redeemAmount || redeeming}
              onClick={handleRedeem}
            >
              {redeeming ? '...' : 'Redeem'}
            </Button>
          </div>
          <div className="flex gap-2">
            {[100, 500, 1000].map(v => (
              <Button
                key={v}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={v > points}
                onClick={() => setRedeemAmount(String(v))}
              >
                {v} pts
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" /> {tierConfig.label} Benefits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
