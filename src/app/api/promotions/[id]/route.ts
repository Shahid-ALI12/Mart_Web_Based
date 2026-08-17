import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────
const UpdatePromotionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED', 'BOGO', 'BUNDLE']).optional(),
  value: z.number().min(0).optional(),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().min(1).optional(),
})

// ─── GET /api/promotions/[id] ─────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const promotion = await db.promotion.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    return NextResponse.json({ data: promotion })
  } catch (error) {
    console.error('[PROMOTION] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/promotions/[id] ─────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdatePromotionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await db.promotion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.value !== undefined) updateData.value = data.value
    if (data.minOrder !== undefined) updateData.minOrder = data.minOrder
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit

    // Validate date range if both are provided
    const effectiveStart = data.startDate ? new Date(data.startDate) : existing.startDate
    const effectiveEnd = data.endDate ? new Date(data.endDate) : existing.endDate
    if (effectiveStart >= effectiveEnd) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Validate percentage value
    if (data.type === 'PERCENTAGE' && data.value !== undefined && data.value > 100) {
      return NextResponse.json(
        { error: 'Percentage value cannot exceed 100' },
        { status: 400 }
      )
    }

    const promotion = await db.promotion.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ data: promotion })
  } catch (error) {
    console.error('[PROMOTION] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/promotions/[id] ──────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.promotion.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })
    }

    await db.promotion.delete({ where: { id } })

    return NextResponse.json({ data: { id }, message: 'Promotion deleted successfully' })
  } catch (error) {
    console.error('[PROMOTION] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
