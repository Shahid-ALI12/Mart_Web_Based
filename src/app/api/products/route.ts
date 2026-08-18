import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  brand: z.string().optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  nutritionInfo: z.string().optional(),
  costPrice: z.number().min(0).default(0),
  retailPrice: z.number().min(0, 'Retail price must be positive'),
  salePrice: z.number().min(0).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  stockQty: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(5),
  maxStockLevel: z.number().int().min(0).optional(),
  unit: z.string().default('piece'),
  weight: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  storeId: z.string().min(1, 'Store is required'),
  supplierId: z.string().optional(),
})

// ─── GET /api/products — List products ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const storeId = searchParams.get('storeId') || ''
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const isFeatured = searchParams.get('isFeatured')
    const isActive = searchParams.get('isActive')

    // Build where clause
    const where: Prisma.ProductWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (storeId) where.storeId = storeId
    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== '')
      where.isFeatured = isFeatured === 'true'
    if (isActive !== null && isActive !== undefined && isActive !== '')
      where.isActive = isActive === 'true'

    // Price range filter
    if (minPrice || maxPrice) {
      where.retailPrice = {
        ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
        ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
      }
    }

    // Build order clause
    const validSortFields = ['createdAt', 'name', 'retailPrice', 'stockQty', 'salePrice']
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          barcode: true,
          brand: true,
          images: true,
          shortDesc: true,
          tags: true,
          costPrice: true,
          retailPrice: true,
          salePrice: true,
          isActive: true,
          isFeatured: true,
          isNewArrival: true,
          isBestSeller: true,
          stockQty: true,
          minStockLevel: true,
          unit: true,
          categoryId: true,
          storeId: true,
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [safeSortBy]: safeSortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[PRODUCTS] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/products — Create product ──────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for unique SKU
    const existing = await db.product.findFirst({
      where: {
        OR: [
          { sku: data.sku },
          ...(data.barcode ? [{ barcode: data.barcode }] : []),
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: existing.sku === data.sku ? 'SKU already exists' : 'Barcode already exists' },
        { status: 409 }
      )
    }

    // Calculate markup
    const markup = data.costPrice > 0 ? ((data.retailPrice - data.costPrice) / data.costPrice) * 100 : 0

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        shortDesc: data.shortDesc,
        brand: data.brand,
        images: JSON.stringify(data.images || []),
        tags: JSON.stringify(data.tags || []),
        nutritionInfo: data.nutritionInfo,
        costPrice: data.costPrice,
        retailPrice: data.retailPrice,
        salePrice: data.salePrice,
        markup,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isNewArrival: data.isNewArrival,
        isBestSeller: data.isBestSeller,
        trackInventory: data.trackInventory,
        stockQty: data.stockQty,
        minStockLevel: data.minStockLevel,
        maxStockLevel: data.maxStockLevel,
        unit: data.unit,
        weight: data.weight,
        categoryId: data.categoryId,
        storeId: data.storeId,
        supplierId: data.supplierId,
      },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error('[PRODUCTS] Create error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
