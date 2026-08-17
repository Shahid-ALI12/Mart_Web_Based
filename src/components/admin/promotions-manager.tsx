'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import {
  Tag, Percent, DollarSign, Plus, Calendar, Users, BarChart3, Gift, Ticket,
} from 'lucide-react'

interface Promotion {
  id: string
  name: string
  type: string
  value: number
  startDate?: string
  endDate?: string
  isActive: boolean
  usageCount?: number
  usageLimit?: number
  minOrder?: number
}

interface Coupon {
  id: string
  code: string
  type: string
  value: number
  minOrder?: number
  usageCount?: number
  usageLimit?: number
  isActive: boolean
  expiresAt?: string
}

const defaultPromoForm = { name: '', type: 'PERCENTAGE', value: '0', minOrder: '0', startDate: '', endDate: '', usageLimit: '' }
const defaultCouponForm = { code: '', type: 'PERCENTAGE', value: '0', minOrder: '0', usageLimit: '', expiresAt: '' }

export default function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const [promoDialogOpen, setPromoDialogOpen] = useState(false)
  const [couponDialogOpen, setCouponDialogOpen] = useState(false)
  const [promoForm, setPromoForm] = useState(defaultPromoForm)
  const [couponForm, setCouponForm] = useState(defaultCouponForm)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [promoRes, couponRes] = await Promise.all([
        fetch('/api/promotions'),
        fetch('/api/coupons'),
      ])
      const promoData = await promoRes.json()
      setPromotions(promoData.data || [])
      const couponData = await couponRes.json()
      setCoupons(couponData.data || [])
    } catch {
      toast({ title: 'Failed to load promotions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Promotion CRUD
  const handleSavePromotion = async () => {
    try {
      const payload = {
        name: promoForm.name,
        type: promoForm.type,
        value: parseFloat(promoForm.value) || 0,
        minOrder: parseFloat(promoForm.minOrder) || 0,
        startDate: promoForm.startDate || undefined,
        endDate: promoForm.endDate || undefined,
        usageLimit: parseInt(promoForm.usageLimit) || undefined,
        isActive: true,
      }
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create promotion')
      toast({ title: 'Promotion created' })
      setPromoDialogOpen(false)
      setPromoForm(defaultPromoForm)
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const togglePromotion = async (promo: Promotion) => {
    try {
      const res = await fetch(`/api/promotions/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promo.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      toast({ title: `Promotion ${!promo.isActive ? 'activated' : 'deactivated'}` })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  // Coupon CRUD
  const handleSaveCoupon = async () => {
    try {
      const payload = {
        code: couponForm.code.toUpperCase(),
        type: couponForm.type,
        value: parseFloat(couponForm.value) || 0,
        minOrder: parseFloat(couponForm.minOrder) || 0,
        usageLimit: parseInt(couponForm.usageLimit) || undefined,
        expiresAt: couponForm.expiresAt || undefined,
        isActive: true,
      }
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create coupon')
      toast({ title: 'Coupon created' })
      setCouponDialogOpen(false)
      setCouponForm(defaultCouponForm)
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle')
      toast({ title: `Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}` })
      fetchData()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Promotions & Coupons</h2>
          <p className="text-sm text-gray-500">Manage discounts and promotional offers</p>
        </div>
      </div>

      <Tabs defaultValue="promotions" className="w-full">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="promotions" className="gap-1.5 text-xs">
            <Gift className="w-3.5 h-3.5" /> Promotions
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5 text-xs">
            <Ticket className="w-3.5 h-3.5" /> Coupons
          </TabsTrigger>
        </TabsList>

        {/* ── Promotions Tab ── */}
        <TabsContent value="promotions" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Active Promotions ({promotions.length})</h3>
            <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Promotion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Promotion</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                    <Input placeholder="e.g. Summer Sale" value={promoForm.name} onChange={(e) => setPromoForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                      <Select value={promoForm.type} onValueChange={(v) => setPromoForm(f => ({ ...f, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Value</label>
                      <Input type="number" value={promoForm.value} onChange={(e) => setPromoForm(f => ({ ...f, value: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Min Order (Rs.)</label>
                    <Input type="number" value={promoForm.minOrder} onChange={(e) => setPromoForm(f => ({ ...f, minOrder: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                      <Input type="date" value={promoForm.startDate} onChange={(e) => setPromoForm(f => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">End Date</label>
                      <Input type="date" value={promoForm.endDate} onChange={(e) => setPromoForm(f => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Usage Limit</label>
                    <Input type="number" placeholder="Unlimited" value={promoForm.usageLimit} onChange={(e) => setPromoForm(f => ({ ...f, usageLimit: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPromoDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSavePromotion}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Value</TableHead>
                    <TableHead className="text-xs">Dates</TableHead>
                    <TableHead className="text-xs">Usage</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary">{p.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.type === 'PERCENTAGE' ? `${p.value}%` : `Rs. ${p.value}`}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'} → {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{p.usageCount || 0}/{p.usageLimit || '∞'}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch checked={p.isActive} onCheckedChange={() => togglePromotion(p)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {promotions.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-gray-400 py-8">No promotions</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── Coupons Tab ── */}
        <TabsContent value="coupons" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Coupons ({coupons.length})</h3>
            <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Coupon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Coupon</DialogTitle></DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Code</label>
                    <Input placeholder="e.g. SAVE20" value={couponForm.code} onChange={(e) => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="uppercase" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                      <Select value={couponForm.type} onValueChange={(v) => setCouponForm(f => ({ ...f, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Value</label>
                      <Input type="number" value={couponForm.value} onChange={(e) => setCouponForm(f => ({ ...f, value: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Min Order (Rs.)</label>
                      <Input type="number" value={couponForm.minOrder} onChange={(e) => setCouponForm(f => ({ ...f, minOrder: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Usage Limit</label>
                      <Input type="number" placeholder="Unlimited" value={couponForm.usageLimit} onChange={(e) => setCouponForm(f => ({ ...f, usageLimit: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Expires At</label>
                    <Input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm(f => ({ ...f, expiresAt: e.target.value }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveCoupon}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-16 rounded-lg" />)}</div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Code</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Value</TableHead>
                    <TableHead className="text-xs">Min Order</TableHead>
                    <TableHead className="text-xs">Usage</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-mono font-bold text-green-700">{c.code}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary">{c.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.type === 'PERCENTAGE' ? `${c.value}%` : `Rs. ${c.value}`}
                      </TableCell>
                      <TableCell className="text-sm">Rs. {c.minOrder || 0}</TableCell>
                      <TableCell className="text-xs">{c.usageCount || 0}/{c.usageLimit || '∞'}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch checked={c.isActive} onCheckedChange={() => toggleCoupon(c)} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {coupons.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-gray-400 py-8">No coupons</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
