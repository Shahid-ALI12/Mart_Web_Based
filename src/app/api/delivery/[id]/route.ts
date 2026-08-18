import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────
const UpdateDeliverySchema = z.object({
  status: z.enum(['PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FAILED']).optional(),
  notes: z.string().optional(),
  deliveryPhoto: z.string().optional(),
  pickupAt: z.string().optional(),
  deliveredAt: z.string().optional(),
})

// ─── GET /api/delivery/[id] — Get delivery trip details ───────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const trip = await db.deliveryTrip.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            paymentStatus: true,
            fulfillmentType: true,
            customer: { select: { id: true, name: true, phone: true, email: true } },
            deliveryAddress: true,
            items: {
              select: {
                id: true,
                name: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
          },
        },
        rider: {
          select: { id: true, name: true, phone: true, avatar: true, email: true },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Delivery trip not found' }, { status: 404 })
    }

    return NextResponse.json({ data: trip })
  } catch (error) {
    console.error('[DELIVERY] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/delivery/[id] — Update delivery status ──────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateDeliverySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await db.deliveryTrip.findUnique({
      where: { id },
      include: { order: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Delivery trip not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.deliveryPhoto !== undefined) updateData.deliveryPhoto = data.deliveryPhoto
    if (data.pickupAt !== undefined) updateData.pickupAt = new Date(data.pickupAt)
    if (data.deliveredAt !== undefined) updateData.deliveredAt = new Date(data.deliveredAt)

    // Auto-set timestamps based on status
    if (data.status === 'PICKED_UP' && !existing.pickupAt) {
      updateData.pickupAt = new Date()
    }
    if (data.status === 'DELIVERED' && !existing.deliveredAt) {
      updateData.deliveredAt = new Date()
    }

    // Map delivery status to order status
    const statusToOrderStatus: Record<string, string> = {
      PICKED_UP: 'PROCESSING',
      ON_THE_WAY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      FAILED: 'CANCELLED',
    }

    // Update delivery trip and optionally order status in a transaction
    const trip = await db.$transaction(async (tx) => {
      const updatedTrip = await tx.deliveryTrip.update({
        where: { id },
        data: updateData,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              customer: { select: { id: true, name: true, phone: true } },
              deliveryAddress: true,
            },
          },
          rider: {
            select: { id: true, name: true, phone: true, avatar: true },
          },
        },
      })

      // Update order status if delivery status maps to an order status
      if (data.status && statusToOrderStatus[data.status]) {
        const orderUpdateData: Record<string, unknown> = {
          status: statusToOrderStatus[data.status],
          timeline: {
            create: {
              status: statusToOrderStatus[data.status],
              note: `Delivery status updated to ${data.status}`,
            },
          },
        }

        if (data.status === 'DELIVERED') {
          orderUpdateData.deliveredAt = new Date()
        }

        await tx.order.update({
          where: { id: existing.orderId },
          data: orderUpdateData,
        })
      }

      return updatedTrip
    })

    return NextResponse.json({ data: trip })
  } catch (error) {
    console.error('[DELIVERY] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
