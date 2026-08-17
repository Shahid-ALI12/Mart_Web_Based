import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schema ────────────────────────────────────────
const ValidateLicenseSchema = z.object({
  key: z.string().min(1, 'License key is required'),
  storeId: z.string().min(1, 'Store ID is required'),
})

// ─── GET /api/license — Get current license info ──────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId') || ''

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    const license = await db.license.findUnique({
      where: { storeId },
      include: {
        subscription: {
          include: {
            invoices: {
              where: { status: { in: ['PENDING', 'OVERDUE'] } },
              orderBy: { dueDate: 'asc' },
              take: 5,
            },
          },
        },
      },
    })

    if (!license) {
      return NextResponse.json({ error: 'No license found for this store' }, { status: 404 })
    }

    const now = new Date()

    // Determine license health
    const isActive = license.status === 'ACTIVE'
    const isTrial = license.status === 'TRIAL'
    const isExpired = license.status === 'EXPIRED' || (license.expiresAt && license.expiresAt < now)
    const daysUntilExpiry = license.expiresAt
      ? Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Trial info
    const trialDaysRemaining =
      isTrial && license.trialEndsAt
        ? Math.max(0, Math.ceil((license.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0

    // Parse features
    let features: Record<string, boolean> = {}
    try {
      features = JSON.parse(license.features)
    } catch {
      features = {}
    }

    return NextResponse.json({
      data: {
        id: license.id,
        plan: license.plan,
        status: license.status,
        isActive,
        isTrial,
        isExpired,
        features,
        maxStores: license.maxStores,
        maxUsers: license.maxUsers,
        maxPosTerminals: license.maxPosTerminals,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        daysUntilExpiry,
        trialStartsAt: license.trialStartsAt,
        trialEndsAt: license.trialEndsAt,
        trialDaysRemaining,
        subscription: license.subscription
          ? {
              id: license.subscription.id,
              plan: license.subscription.plan,
              amount: license.subscription.amount,
              currency: license.subscription.currency,
              billingCycle: license.subscription.billingCycle,
              nextBillingDate: license.subscription.nextBillingDate,
              autoRenew: license.subscription.autoRenew,
              status: license.subscription.status,
              pendingInvoices: license.subscription.invoices,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('[LICENSE] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/license — Validate license key ────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ValidateLicenseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { key, storeId } = parsed.data
    const now = new Date()

    const license = await db.license.findFirst({
      where: {
        key,
        storeId,
      },
    })

    if (!license) {
      return NextResponse.json(
        { valid: false, error: 'Invalid license key for this store' },
        { status: 404 }
      )
    }

    // Check if expired
    if (license.status === 'EXPIRED' || (license.expiresAt && license.expiresAt < now)) {
      return NextResponse.json(
        { valid: false, error: 'License has expired', plan: license.plan, expiresAt: license.expiresAt },
        { status: 400 }
      )
    }

    // Check if suspended/cancelled
    if (license.status === 'SUSPENDED' || license.status === 'CANCELLED') {
      return NextResponse.json(
        { valid: false, error: `License is ${license.status.toLowerCase()}` },
        { status: 403 }
      )
    }

    // Check if past due
    if (license.status === 'PAST_DUE') {
      return NextResponse.json(
        { valid: false, error: 'License payment is past due', plan: license.plan },
        { status: 402 }
      )
    }

    // Check trial expiry
    if (license.status === 'TRIAL' && license.trialEndsAt && license.trialEndsAt < now) {
      await db.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      })
      return NextResponse.json(
        { valid: false, error: 'Trial period has expired' },
        { status: 400 }
      )
    }

    // Valid license
    let features: Record<string, boolean> = {}
    try {
      features = JSON.parse(license.features)
    } catch {
      features = {}
    }

    const daysUntilExpiry = license.expiresAt
      ? Math.ceil((license.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    return NextResponse.json({
      valid: true,
      license: {
        id: license.id,
        plan: license.plan,
        status: license.status,
        features,
        maxStores: license.maxStores,
        maxUsers: license.maxUsers,
        maxPosTerminals: license.maxPosTerminals,
        expiresAt: license.expiresAt,
        daysUntilExpiry,
        activatedAt: license.activatedAt,
      },
      message: 'License is valid',
    })
  } catch (error) {
    console.error('[LICENSE] Validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
