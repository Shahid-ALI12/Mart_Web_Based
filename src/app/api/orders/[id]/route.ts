import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────
const UpdateOrderSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
  ]).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
  deliveredAt: z.string().optional(),
})

// ─── GET /api/orders/[id] ─────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, avatar: true },
        },
        store: {
          select: { id: true, name: true, slug: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, images: true, retailPrice: true },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        deliveryAddress: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('[ORDER] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/orders/[id] ─────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod
    if (data.paymentRef !== undefined) updateData.paymentRef = data.paymentRef
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.cancelReason !== undefined) updateData.cancelReason = data.cancelReason
    if (data.deliveredAt !== undefined) updateData.deliveredAt = new Date(data.deliveredAt)

    // If status changed to DELIVERED, set deliveredAt
    if (data.status === 'DELIVERED' && !existing.deliveredAt) {
      updateData.deliveredAt = new Date()
    }

    // Create timeline entry for status change
    const timelineCreate = data.status
      ? {
          timeline: {
            create: {
              status: data.status,
              note: `Status updated to ${data.status}`,
            },
          },
        }
      : {}

    const order = await db.order.update({
      where: { id },
      data: {
        ...updateData,
        ...timelineCreate,
      },
      include: {
        items: true,
        timeline: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('[ORDER] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
