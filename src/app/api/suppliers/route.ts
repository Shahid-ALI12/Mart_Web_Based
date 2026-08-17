import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const CreateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  code: z.string().min(1, 'Supplier code is required'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
})

// ─── GET /api/suppliers — List suppliers ──────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search') || ''

    const where: Prisma.SupplierWhereInput = {}

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { contactName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [suppliers, total] = await Promise.all([
      db.supplier.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          contactName: true,
          phone: true,
          email: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { products: true, purchaseOrders: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.supplier.count({ where }),
    ])

    return NextResponse.json({
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[SUPPLIERS] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/suppliers — Create supplier ────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateSupplierSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check for unique code
    const existing = await db.supplier.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Supplier code already exists' },
        { status: 409 }
      )
    }

    const supplier = await db.supplier.create({
      data: {
        name: data.name,
        code: data.code,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    console.error('[SUPPLIERS] Create error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 409 }
        )
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
