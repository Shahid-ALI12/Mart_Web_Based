import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ─── GET /api/riders — List all RIDER role users ──────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || ''

    const where: Prisma.UserWhereInput = {
      role: 'RIDER',
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [riders, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: { deliveryTrips: true },
          },
          deliveryTrips: {
            where: {
              status: { in: ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] },
            },
            take: 1,
            select: {
              id: true,
              status: true,
              orderId: true,
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    // Enrich with delivery stats
    const ridersWithStats = await Promise.all(
      riders.map(async (rider) => {
        const deliveredCount = await db.deliveryTrip.count({
          where: {
            riderId: rider.id,
            status: 'DELIVERED',
          },
        })
        const totalEarnings = await db.deliveryTrip.aggregate({
          where: {
            riderId: rider.id,
            status: 'DELIVERED',
          },
          _sum: { earnings: true },
        })

        return {
          ...rider,
          stats: {
            totalDeliveries: deliveredCount,
            totalEarnings: totalEarnings._sum.earnings || 0,
            currentTrip: rider.deliveryTrips[0] || null,
          },
          deliveryTrips: undefined,
        }
      })
    )

    return NextResponse.json({
      data: ridersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[RIDERS] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
