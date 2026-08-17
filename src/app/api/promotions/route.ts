import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const CreatePromotionSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  name: z.string().min(1, 'Promotion name is required'),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'BOGO', 'BUNDLE']),
  value: z.number().min(0, 'Value must be non-negative'),
  minOrder: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().min(1).optional(),
})

// ─── GET /api/promotions — List promotions ────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const storeId = searchParams.get('storeId') || ''
    const type = searchParams.get('type') || ''
    const isActive = searchParams.get('isActive')
    const now = searchParams.get('now') // filter currently active promotions

    const where: Prisma.PromotionWhereInput = {}

    if (storeId) where.storeId = storeId
    if (type) where.type = type as Prisma.EnumPromoTypeFilter
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Filter promotions that are currently active (within date range)
    if (now === 'true') {
      const currentDate = new Date()
      where.startDate = { lte: currentDate }
      where.endDate = { gte: currentDate }
      where.isActive = true
    }

    const [promotions, total] = await Promise.all([
      db.promotion.findMany({
        where,
        include: {
          store: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.promotion.count({ where }),
    ])

    return NextResponse.json({
      data: promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[PROMOTIONS] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/promotions — Create promotion ──────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreatePromotionSchema.safeParse(body)

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

    // Validate date range
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate percentage value
    if (data.type === 'PERCENTAGE' && data.value > 100) {
      return NextResponse.json(
        { error: 'Percentage value cannot exceed 100' },
        { status: 400 }
      )
    }

    const promotion = await db.promotion.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        minOrder: data.minOrder,
        maxDiscount: data.maxDiscount,
        startDate,
        endDate,
        isActive: data.isActive,
        usageLimit: data.usageLimit,
      },
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ data: promotion }, { status: 201 })
  } catch (error) {
    console.error('[PROMOTIONS] Create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
