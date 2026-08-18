import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ─── GET /api/stats — Dashboard statistics ────────────────────
export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Run all aggregations in parallel
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      totalRevenue,
      totalCustomers,
      recentOrders,
      ordersByStatus,
      topCategories,
      expiringBatches,
    ] = await Promise.all([
      // Total products count
      db.product.count(),

      // Active products count
      db.product.count({ where: { isActive: true } }),

      // Total orders count
      db.order.count(),

      // Total revenue (from delivered/paid orders)
      db.order.aggregate({
        where: {
          status: { in: ['DELIVERED', 'CONFIRMED'] },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),

      // Total customers
      db.user.count({ where: { role: 'CUSTOMER' } }),

      // Recent 5 orders
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          customer: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),

      // Orders by status breakdown
      db.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Top categories by product count
      db.category.findMany({
        take: 5,
        orderBy: { products: { _count: 'desc' } },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
      }),

      // Expiring batches (within 30 days)
      db.productBatch.count({
        where: {
          expiryDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
          isActive: true,
          remainingQty: { gt: 0 },
        },
      }),
    ])

    // Low stock products — use raw SQL for column-to-column comparison (SQLite)
    const lowStockResults = await db.$queryRaw<Array<{ id: string; name: string; sku: string; stockQty: number; minStockLevel: number; retailPrice: number; categoryName: string }>>`
      SELECT p.id, p.name, p.sku, p.stockQty, p."minStockLevel", p."retailPrice",
             c.name AS categoryName
      FROM Product p
      LEFT JOIN Category c ON p."categoryId" = c.id
      WHERE p."isActive" = 1
        AND p."trackInventory" = 1
        AND p."stockQty" <= p."minStockLevel"
      ORDER BY p."stockQty" ASC
      LIMIT 10
    `

    const lowStockCount = lowStockResults.length

    // Recent orders revenue (last 30 days)
    const recentRevenue = await db.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['DELIVERED', 'CONFIRMED'] },
        paymentStatus: 'PAID',
      },
      _sum: { total: true },
    })

    // Recent orders count (last 30 days)
    const recentOrderCount = await db.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    })

    // Format orders by status
    const statusBreakdown: Record<string, number> = {}
    for (const entry of ordersByStatus) {
      statusBreakdown[entry.status] = entry._count.status
    }

    // Format low stock products
    const lowStockProducts = lowStockResults.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQty: p.stockQty,
      minStockLevel: p.minStockLevel,
      retailPrice: p.retailPrice,
      category: { name: p.categoryName },
    }))

    return NextResponse.json({
      data: {
        overview: {
          totalProducts,
          activeProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          totalCustomers,
          lowStockCount,
          expiringBatches,
        },
        trends: {
          recentOrderCount,
          recentRevenue: recentRevenue._sum.total || 0,
          periodDays: 30,
        },
        recentOrders,
        statusBreakdown,
        topCategories,
        lowStockProducts,
      },
    })
  } catch (error) {
    console.error('[STATS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
