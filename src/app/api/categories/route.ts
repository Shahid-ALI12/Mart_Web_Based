import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schema ────────────────────────────────────────
const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  banner: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  storeId: z.string().min(1, 'Store is required'),
})

// ─── Helper: Build category tree ──────────────────────────────
function buildCategoryTree(categories: any[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// ─── GET /api/categories — List categories ────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId') || ''
    const tree = searchParams.get('tree') === 'true'

    const where: Prisma.CategoryWhereInput = {}
    if (storeId) where.storeId = storeId

    const categories = await db.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true, products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })

    if (tree) {
      const treeData = buildCategoryTree(categories)
      return NextResponse.json({ data: treeData })
    }

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('[CATEGORIES] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/categories — Create category ───────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await db.category.findUnique({ where: { id: data.parentId } })
      if (!parent) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 })
      }
    }

    const category = await db.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        banner: data.banner,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        storeId: data.storeId,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('[CATEGORIES] Create error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Category slug already exists for this store' }, { status: 409 })
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
