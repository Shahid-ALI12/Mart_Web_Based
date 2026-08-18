import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const CreateOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  storeId: z.string().min(1, 'Store ID is required'),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
    })
  ).min(1, 'At least one item is required'),
  couponCode: z.string().optional(),
  deliveryAddressId: z.string().optional(),
  deliveryNotes: z.string().optional(),
  deliveryTimeSlot: z.string().optional(),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  loyaltyPointsUsed: z.number().int().min(0).default(0),
})

// ─── GET /api/orders — List orders ────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const status = searchParams.get('status') || ''
    const customerId = searchParams.get('customerId') || ''
    const storeId = searchParams.get('storeId') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const search = searchParams.get('search') || ''

    const where: Prisma.OrderWhereInput = {}

    if (status) where.status = status as Prisma.EnumOrderStatusFilter
    if (customerId) where.customerId = customerId
    if (storeId) where.storeId = storeId
    if (paymentStatus) where.paymentStatus = paymentStatus as Prisma.EnumPaymentStatusFilter
    if (search) where.orderNumber = { contains: search }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      }
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentType: true,
          subtotal: true,
          discount: true,
          tax: true,
          deliveryFee: true,
          total: true,
          couponCode: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          customer: { select: { id: true, name: true, email: true, phone: true } },
          store: { select: { id: true, name: true, slug: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[ORDERS] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/orders — Create order ──────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify customer exists
    const customer = await db.user.findUnique({ where: { id: data.customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItemsData: { productId: string; variantId?: string; name: string; sku: string; quantity: number; unitPrice: number; totalPrice: number; discount: number }[] = []

    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, sku: true, stockQty: true, trackInventory: true },
      })

      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
      }

      // Stock check
      if (product.trackInventory && product.stockQty < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stockQty}` },
          { status: 400 }
        )
      }

      const totalPrice = item.unitPrice * item.quantity
      subtotal += totalPrice

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        discount: 0,
      })
    }

    // Apply coupon discount
    let discount = 0
    if (data.couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: data.couponCode },
      })

      if (coupon && coupon.isActive && new Date() >= coupon.startDate && new Date() <= coupon.endDate) {
        if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
          if (subtotal >= coupon.minOrder) {
            if (coupon.discountType === 'PERCENTAGE') {
              discount = (subtotal * coupon.discountValue) / 100
              if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
            } else {
              discount = coupon.discountValue
            }

            // Increment coupon usage
            await db.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            })
          }
        }
      }
    }

    // Calculate tax (simplified: 0% default, store tax rate applied later)
    const tax = 0
    const deliveryFee = 0
    const loyaltyDiscount = 0 // Loyalty points redemption can be expanded

    const total = subtotal - discount - loyaltyDiscount + tax + deliveryFee

    // Generate order number
    const orderCount = await db.order.count()
    const orderNumber = `ORD-${String(orderCount + 1).padStart(6, '0')}`

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        storeId: data.storeId,
        customerId: data.customerId,
        subtotal,
        discount,
        tax,
        deliveryFee,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        fulfillmentType: data.fulfillmentType,
        paymentMethod: data.paymentMethod,
        couponCode: data.couponCode,
        deliveryAddressId: data.deliveryAddressId,
        deliveryNotes: data.deliveryNotes,
        deliveryTimeSlot: data.deliveryTimeSlot,
        notes: data.notes,
        loyaltyPointsUsed: data.loyaltyPointsUsed,
        items: {
          create: orderItemsData,
        },
        timeline: {
          create: {
            status: 'PENDING',
            note: 'Order created',
          },
        },
      },
      include: {
        items: true,
        timeline: true,
      },
    })

    // Decrement stock for each item
    for (const item of data.items) {
      await db.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      })
    }

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('[ORDERS] Create error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Order number conflict, please retry' }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
