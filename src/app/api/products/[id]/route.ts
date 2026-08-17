import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  brand: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  nutritionInfo: z.string().optional(),
  costPrice: z.number().min(0).optional(),
  retailPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  stockQty: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).nullable().optional(),
  unit: z.string().optional(),
  weight: z.number().positive().nullable().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().nullable().optional(),
})

// ─── GET /api/products/[id] ───────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, parentId: true } },
        store: { select: { id: true, name: true, slug: true } },
        supplier: { select: { id: true, name: true, code: true } },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        batches: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Compute average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0

    return NextResponse.json({
      data: product,
      meta: {
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
        variantCount: product.variants.length,
      },
    })
  } catch (error) {
    console.error('[PRODUCT] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/products/[id] ───────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Check product exists
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const data = parsed.data

    // Build update payload
    const updateData: Prisma.ProductUpdateInput = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc
    if (data.brand !== undefined) updateData.brand = data.brand
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images)
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
    if (data.nutritionInfo !== undefined) updateData.nutritionInfo = data.nutritionInfo
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
    if (data.isNewArrival !== undefined) updateData.isNewArrival = data.isNewArrival
    if (data.isBestSeller !== undefined) updateData.isBestSeller = data.isBestSeller
    if (data.trackInventory !== undefined) updateData.trackInventory = data.trackInventory
    if (data.stockQty !== undefined) updateData.stockQty = data.stockQty
    if (data.minStockLevel !== undefined) updateData.minStockLevel = data.minStockLevel
    if (data.maxStockLevel !== undefined) updateData.maxStockLevel = data.maxStockLevel
    if (data.unit !== undefined) updateData.unit = data.unit
    if (data.weight !== undefined) updateData.weight = data.weight
    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } }
    if (data.supplierId !== undefined) {
      updateData.supplier = data.supplierId ? { connect: { id: data.supplierId } } : { disconnect: true }
    }

    // Handle pricing & markup recalculation
    const newCostPrice = data.costPrice ?? existing.costPrice
    const newRetailPrice = data.retailPrice ?? existing.retailPrice
    if (data.costPrice !== undefined || data.retailPrice !== undefined) {
      updateData.costPrice = newCostPrice
      updateData.retailPrice = newRetailPrice
      updateData.markup = newCostPrice > 0 ? ((newRetailPrice - newCostPrice) / newCostPrice) * 100 : 0
    }
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice

    const product = await db.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[PRODUCT] Update error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/products/[id] ────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Soft delete: set isActive = false
    await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Product deactivated successfully' })
  } catch (error) {
    console.error('[PRODUCT] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
