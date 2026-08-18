import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────
const VerifyOtpSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  otp: z.string().min(1, 'OTP is required'),
})

// ─── POST /api/delivery/verify-otp — Verify delivery OTP ──────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = VerifyOtpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { tripId, otp } = parsed.data

    const trip = await db.deliveryTrip.findUnique({
      where: { id: tripId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            customer: { select: { id: true, name: true } },
          },
        },
        rider: {
          select: { id: true, name: true },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: 'Delivery trip not found' }, { status: 404 })
    }

    // Check if trip is already delivered
    if (trip.status === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Delivery already completed' },
        { status: 400 }
      )
    }

    // Check if trip is in a valid state for OTP verification
    if (trip.status !== 'ON_THE_WAY' && trip.status !== 'PICKED_UP' && trip.status !== 'ASSIGNED') {
      return NextResponse.json(
        { error: `Cannot verify OTP for trip in ${trip.status} status` },
        { status: 400 }
      )
    }

    // Verify OTP
    if (trip.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Mark as delivered in a transaction
    const updatedTrip = await db.$transaction(async (tx) => {
      const updated = await tx.deliveryTrip.update({
        where: { id: tripId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              customer: { select: { id: true, name: true } },
            },
          },
          rider: {
            select: { id: true, name: true },
          },
        },
      })

      // Update order status to DELIVERED
      await tx.order.update({
        where: { id: trip.orderId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          timeline: {
            create: {
              status: 'DELIVERED',
              note: 'Delivery confirmed via OTP verification',
            },
          },
        },
      })

      return updated
    })

    return NextResponse.json({
      data: updatedTrip,
      message: 'OTP verified successfully. Delivery confirmed.',
    })
  } catch (error) {
    console.error('[DELIVERY] Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
