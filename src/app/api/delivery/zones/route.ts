import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const CreateZoneSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  name: z.string().min(1, 'Zone name is required'),
  minOrder: z.number().min(0).default(0),
  deliveryFee: z.number().min(0).default(0),
  estimatedMinutes: z.number().int().min(1).default(30),
  isActive: z.boolean().default(true),
})

// ─── GET /api/delivery/zones — List delivery zones ────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId') || ''
    const isActive = searchParams.get('isActive')

    const where: Prisma.DeliveryZoneWhereInput = {}

    if (storeId) where.storeId = storeId
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const zones = await db.deliveryZone.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: zones })
  } catch (error) {
    console.error('[DELIVERY_ZONES] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/delivery/zones — Create delivery zone ──────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateZoneSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify store exists
    const store = await db.store.findUnique({ where: { id: data.storeId } })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const zone = await db.deliveryZone.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        minOrder: data.minOrder,
        deliveryFee: data.deliveryFee,
        estimatedMinutes: data.estimatedMinutes,
        isActive: data.isActive,
      },
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ data: zone }, { status: 201 })
  } catch (error) {
    console.error('[DELIVERY_ZONES] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
