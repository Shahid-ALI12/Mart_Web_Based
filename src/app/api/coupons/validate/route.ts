import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────
const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  userId: z.string().optional(),
})

// ─── POST /api/coupons/validate — Validate coupon ─────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ValidateCouponSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { code, subtotal, userId } = parsed.data
    const now = new Date()

    const coupon = await db.coupon.findUnique({
      where: { code },
    })

    // Coupon not found
    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    // Check if active
    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Coupon is no longer active' },
        { status: 400 }
      )
    }

    // Check date validity
    if (now < coupon.startDate) {
      return NextResponse.json(
        { valid: false, error: 'Coupon is not yet active' },
        { status: 400 }
      )
    }

    if (now > coupon.endDate) {
      return NextResponse.json(
        { valid: false, error: 'Coupon has expired' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, error: 'Coupon usage limit has been reached' },
        { status: 400 }
      )
    }

    // Check minimum order amount
    if (subtotal < coupon.minOrder) {
      return NextResponse.json(
        { valid: false, error: `Minimum order amount is ${coupon.minOrder}` },
        { status: 400 }
      )
    }

    // Check per-user limit (if userId provided)
    if (userId && coupon.perUserLimit) {
      const userUsageCount = await db.order.count({
        where: {
          customerId: userId,
          couponCode: code,
          status: { notIn: ['CANCELLED'] },
        },
      })

      if (userUsageCount >= coupon.perUserLimit) {
        return NextResponse.json(
          { valid: false, error: 'You have already used this coupon the maximum number of times' },
          { status: 400 }
        )
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount)
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Math.min(coupon.discountValue, subtotal)
    } else {
      // BOGO and BUNDLE require more complex logic handled at order creation
      discountAmount = 0
    }

    const finalTotal = subtotal - discountAmount

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalTotal: Math.round(finalTotal * 100) / 100,
      message:
        coupon.discountType === 'PERCENTAGE'
          ? `${coupon.discountValue}% discount applied`
          : `${coupon.discountValue} off applied`,
    })
  } catch (error) {
    console.error('[COUPON] Validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
