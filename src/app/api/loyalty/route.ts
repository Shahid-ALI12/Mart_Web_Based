import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schemas ───────────────────────────────────────
const EarnPointsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  points: z.number().int().min(1, 'Points must be at least 1'),
  reference: z.string().optional(), // e.g. orderId
  note: z.string().optional(),
})

const RedeemPointsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  points: z.number().int().min(1, 'Points must be at least 1'),
  note: z.string().optional(),
})

// ─── Tier thresholds ──────────────────────────────────────────
const TIER_THRESHOLDS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 500,
  GOLD: 2000,
  PLATINUM: 5000,
}

function determineTier(totalEarned: number): string {
  if (totalEarned >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (totalEarned >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (totalEarned >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

// ─── GET /api/loyalty — Get loyalty points for user ───────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const loyalty = await db.loyaltyPoint.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    if (!loyalty) {
      // Return default loyalty data if user exists but has no loyalty record
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true },
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        data: {
          userId,
          points: 0,
          tier: 'BRONZE',
          totalEarned: 0,
          totalRedeemed: 0,
          user,
          nextTier: 'SILVER',
          pointsToNextTier: TIER_THRESHOLDS.SILVER,
        },
      })
    }

    // Calculate next tier info
    const currentTierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
    const currentTierIndex = currentTierOrder.indexOf(loyalty.tier)
    const nextTier = currentTierIndex < currentTierOrder.length - 1
      ? currentTierOrder[currentTierIndex + 1]
      : null
    const pointsToNextTier = nextTier
      ? Math.max(0, TIER_THRESHOLDS[nextTier] - loyalty.totalEarned)
      : 0

    return NextResponse.json({
      data: {
        ...loyalty,
        nextTier,
        pointsToNextTier,
      },
    })
  } catch (error) {
    console.error('[LOYALTY] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/loyalty — Earn points ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = EarnPointsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert loyalty points
    const loyalty = await db.loyaltyPoint.upsert({
      where: { userId: data.userId },
      create: {
        userId: data.userId,
        points: data.points,
        tier: 'BRONZE',
        totalEarned: data.points,
        totalRedeemed: 0,
      },
      update: {
        points: { increment: data.points },
        totalEarned: { increment: data.points },
      },
    })

    // Recalculate tier based on total earned
    const newTier = determineTier(loyalty.totalEarned)
    if (newTier !== loyalty.tier) {
      await db.loyaltyPoint.update({
        where: { id: loyalty.id },
        data: { tier: newTier as Prisma.EnumLoyaltyTierFilter },
      })
    }

    const updatedLoyalty = await db.loyaltyPoint.findUnique({
      where: { id: loyalty.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      data: updatedLoyalty,
      message: `Earned ${data.points} loyalty points`,
    })
  } catch (error) {
    console.error('[LOYALTY] Earn error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/loyalty — Redeem points ─────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RedeemPointsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    const loyalty = await db.loyaltyPoint.findUnique({
      where: { userId: data.userId },
    })

    if (!loyalty) {
      return NextResponse.json(
        { error: 'User has no loyalty account' },
        { status: 404 }
      )
    }

    if (loyalty.points < data.points) {
      return NextResponse.json(
        { error: `Insufficient points. Available: ${loyalty.points}, Requested: ${data.points}` },
        { status: 400 }
      )
    }

    // Deduct points
    const updated = await db.loyaltyPoint.update({
      where: { id: loyalty.id },
      data: {
        points: { decrement: data.points },
        totalRedeemed: { increment: data.points },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Update wallet if user has one (convert points to wallet balance)
    // Assuming 1 point = 1 PKR for simplicity
    const wallet = await db.wallet.findUnique({
      where: { userId: data.userId },
    })

    if (wallet) {
      await db.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: data.points },
          transactions: {
            create: {
              type: 'LOYALTY_REDEEM',
              amount: data.points,
              balance: wallet.balance + data.points,
              reference: `loyalty-redeem-${loyalty.id}`,
              note: data.note || `Redeemed ${data.points} loyalty points`,
            },
          },
        },
      })
    }

    return NextResponse.json({
      data: updated,
      message: `Redeemed ${data.points} loyalty points`,
    })
  } catch (error) {
    console.error('[LOYALTY] Redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
