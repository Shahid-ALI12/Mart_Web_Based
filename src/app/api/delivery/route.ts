import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const AssignRiderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  riderId: z.string().min(1, 'Rider ID is required'),
  notes: z.string().optional(),
  earnings: z.number().min(0).default(0),
})

// ─── GET /api/delivery — List delivery trips ──────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') || ''
    const riderId = searchParams.get('riderId') || ''
    const orderId = searchParams.get('orderId') || ''

    const where: Prisma.DeliveryTripWhereInput = {}

    if (status) where.status = status as Prisma.EnumDeliveryStatusFilter
    if (riderId) where.riderId = riderId
    if (orderId) where.orderId = orderId

    const [trips, total] = await Promise.all([
      db.deliveryTrip.findMany({
        where,
        select: {
          id: true,
          orderId: true,
          riderId: true,
          status: true,
          pickupAt: true,
          deliveredAt: true,
          deliveryPhoto: true,
          otp: true,
          notes: true,
          earnings: true,
          createdAt: true,
          updatedAt: true,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.deliveryTrip.count({ where }),
    ])

    return NextResponse.json({
      data: trips,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[DELIVERY] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/delivery — Assign rider to order ───────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AssignRiderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify order exists and doesn't already have a delivery trip
    const order = await db.order.findUnique({
      where: { id: data.orderId },
      include: { delivery: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.delivery) {
      return NextResponse.json(
        { error: 'Order already has a delivery trip assigned' },
        { status: 409 }
      )
    }

    // Verify rider exists and has RIDER role
    const rider = await db.user.findUnique({
      where: { id: data.riderId },
    })

    if (!rider) {
      return NextResponse.json({ error: 'Rider not found' }, { status: 404 })
    }

    if (rider.role !== 'RIDER') {
      return NextResponse.json({ error: 'User is not a rider' }, { status: 400 })
    }

    if (!rider.isActive) {
      return NextResponse.json({ error: 'Rider is not active' }, { status: 400 })
    }

    // Generate OTP for delivery verification
    const otp = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create delivery trip and update order status in a transaction
    const trip = await db.$transaction(async (tx) => {
      const newTrip = await tx.deliveryTrip.create({
        data: {
          orderId: data.orderId,
          riderId: data.riderId,
          status: 'ASSIGNED',
          otp,
          notes: data.notes,
          earnings: data.earnings,
        },
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

      // Update order status to OUT_FOR_DELIVERY
      await tx.order.update({
        where: { id: data.orderId },
        data: {
          status: 'OUT_FOR_DELIVERY',
          timeline: {
            create: {
              status: 'OUT_FOR_DELIVERY',
              note: `Rider ${rider.name} assigned for delivery. OTP: ${otp}`,
            },
          },
        },
      })

      return newTrip
    })

    return NextResponse.json({ data: trip }, { status: 201 })
  } catch (error) {
    console.error('[DELIVERY] Assign rider error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Delivery trip already exists for this order' },
          { status: 409 }
        )
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
