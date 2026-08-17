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
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import {
  Truck, MapPin, Plus, UserCheck, Clock, DollarSign, Edit, Eye, Package, Bike, ChevronRight,
} from 'lucide-react'

// --- Types ---
interface DeliveryZone {
  id: string
  name: string
  minOrder: number
  deliveryFee: number
  estimatedMinutes: number
  isActive?: boolean
}

interface Rider {
  id: string
  name: string
  phone?: string
  isAvailable?: boolean
}

interface Delivery {
  id: string
  orderId: string
  orderNumber?: string
  riderId?: string
  riderName?: string
  status: string
  otp?: string
  pickupAt?: string
  deliveredAt?: string
  estimatedMinutes?: number
  createdAt: string
  customerName?: string
  customerAddress?: string
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ASSIGNED: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Assigned' },
  PICKED_UP: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Picked Up' },
  ON_THE_WAY: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'On the Way' },
  DELIVERED: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Delivered' },
  FAILED: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Failed' },
}

export default function DeliveryManager() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(true)

  // Dialog states
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [selectedRiderId, setSelectedRiderId] = useState('')

  // Zone form
  const [zoneForm, setZoneForm] = useState({ name: '', minOrder: '0', deliveryFee: '0', estimatedMinutes: '30' })
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)

  const fetchZones = useCallback(async () => {
    setZonesLoading(true)
    try {
      const res = await fetch('/api/delivery/zones')
      const data = await res.json()
      setZones(data.data || [])
    } catch {
      toast({ title: 'Failed to load zones', variant: 'destructive' })
    } finally {
      setZonesLoading(false)
    }
  }, [])

  const fetchDeliveries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/delivery')
      const data = await res.json()
      setDeliveries(data.data || [])
    } catch {
      toast({ title: 'Failed to load deliveries', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRiders = useCallback(async () => {
    try {
      const res = await fetch('/api/riders')
      const data = await res.json()
      setRiders(data.data || [])
    } catch {
      toast({ title: 'Failed to load riders', variant: 'destructive' })
    }
  }, [])

  useEffect(() => {
    fetchZones()
    fetchDeliveries()
    fetchRiders()
  }, [fetchZones, fetchDeliveries, fetchRiders])

  // Zone CRUD
  const handleSaveZone = async () => {
    try {
      const payload = {
        name: zoneForm.name,
        minOrder: parseFloat(zoneForm.minOrder) || 0,
        deliveryFee: parseFloat(zoneForm.deliveryFee) || 0,
        estimatedMinutes: parseInt(zoneForm.estimatedMinutes) || 30,
      }
      if (editingZoneId) {
        const res = await fetch(`/api/delivery/zones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingZoneId }),
        })
        if (!res.ok) throw new Error('Failed to update zone')
        toast({ title: 'Zone updated' })
      } else {
        const res = await fetch('/api/delivery/zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create zone')
        toast({ title: 'Zone created' })
      }
      setZoneDialogOpen(false)
      setEditingZoneId(null)
      setZoneForm({ name: '', minOrder: '0', deliveryFee: '0', estimatedMinutes: '30' })
      fetchZones()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZoneId(zone.id)
    setZoneForm({
      name: zone.name,
      minOrder: String(zone.minOrder),
      deliveryFee: String(zone.deliveryFee),
      estimatedMinutes: String(zone.estimatedMinutes),
    })
    setZoneDialogOpen(true)
  }

  // Assign rider
  const handleAssignRider = async () => {
    if (!selectedDelivery || !selectedRiderId) return
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedDelivery.orderId,
          riderId: selectedRiderId,
        }),
      })
      if (!res.ok) throw new Error('Failed to assign rider')
      toast({ title: 'Rider assigned successfully' })
      setAssignDialogOpen(false)
      setSelectedDelivery(null)
      setSelectedRiderId('')
      fetchDeliveries()
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const openAssignDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery)
    setSelectedRiderId('')
    setAssignDialogOpen(true)
  }

  const activeDeliveries = deliveries.filter(d => d.status !== 'DELIVERED' && d.status !== 'FAILED')
  const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED' || d.status === 'FAILED')

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Management</h2>
          <p className="text-sm text-gray-500">Manage delivery zones, trips & riders</p>
        </div>
      </div>

      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="zones" className="gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5" /> Zones
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1.5 text-xs">
            <Truck className="w-3.5 h-3.5" /> Active ({activeDeliveries.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5 text-xs">
            <Package className="w-3.5 h-3.5" /> Completed
          </TabsTrigger>
        </TabsList>

        {/* ── Zones Tab ── */}
        <TabsContent value="zones" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Delivery Zones</h3>
            <Dialog open={zoneDialogOpen} onOpenChange={(open) => {
              setZoneDialogOpen(open)
              if (!open) { setEditingZoneId(null); setZoneForm({ name: '', minOrder: '0', deliveryFee: '0', estimatedMinutes: '30' }) }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Zone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingZoneId ? 'Edit Zone' : 'Add Delivery Zone'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Zone Name</label>
                    <Input
                      placeholder="e.g. City Center"
                      value={zoneForm.name}
                      onChange={(e) => setZoneForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Min Order (Rs.)</label>
                      <Input
                        type="number"
                        value={zoneForm.minOrder}
                        onChange={(e) => setZoneForm(f => ({ ...f, minOrder: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Delivery Fee (Rs.)</label>
                      <Input
                        type="number"
                        value={zoneForm.deliveryFee}
                        onChange={(e) => setZoneForm(f => ({ ...f, deliveryFee: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Est. Delivery (minutes)</label>
                    <Input
                      type="number"
                      value={zoneForm.estimatedMinutes}
                      onChange={(e) => setZoneForm(f => ({ ...f, estimatedMinutes: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveZone}>
                    {editingZoneId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {zonesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : zones.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No delivery zones configured</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <Card key={zone.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditZone(zone)}>
                        <Edit className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Min Order</span>
                        <span className="font-medium">Rs. {zone.minOrder.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Delivery Fee</span>
                        <span className="font-medium">Rs. {zone.deliveryFee.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Est. Time</span>
                        <span className="font-medium">{zone.estimatedMinutes} min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Active Deliveries Tab ── */}
        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : activeDeliveries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Truck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active deliveries</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Order</TableHead>
                    <TableHead className="text-xs">Rider</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">ETA</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeDeliveries.map((d) => {
                    const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.ASSIGNED
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm font-medium">{d.orderNumber || d.orderId?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">
                          {d.riderName ? (
                            <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-green-600" /> {d.riderName}</span>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {d.estimatedMinutes ? `${d.estimatedMinutes} min` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {!d.riderId && (
                            <Button size="sm" variant="outline" className="gap-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => openAssignDialog(d)}>
                              <UserCheck className="w-3.5 h-3.5" /> Assign
                            </Button>
                          )}
                          {d.otp && (
                            <Badge variant="secondary" className="ml-2 font-mono text-xs">OTP: {d.otp}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── Completed Deliveries Tab ── */}
        <TabsContent value="completed" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : completedDeliveries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No completed deliveries</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Order</TableHead>
                    <TableHead className="text-xs">Rider</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Delivered At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedDeliveries.map((d) => {
                    const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.DELIVERED
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm font-medium">{d.orderNumber || d.orderId?.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{d.riderName || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Assign Rider Dialog ── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Rider</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500">
              Assign a rider to delivery <span className="font-medium text-gray-900">{selectedDelivery?.orderNumber || selectedDelivery?.orderId?.slice(0, 8)}</span>
            </p>
            <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a rider..." />
              </SelectTrigger>
              <SelectContent>
                {riders.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      <Bike className="w-3.5 h-3.5 text-green-600" />
                      {r.name}
                      {r.phone && <span className="text-gray-400 text-xs">({r.phone})</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {riders.length === 0 && (
              <p className="text-xs text-red-500">No riders available. Add riders first.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!selectedRiderId}
              onClick={handleAssignRider}
            >
              Assign Rider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
