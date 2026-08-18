import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── GET /api/reports — Report data by type ───────────────────
// type: sales | products | inventory | customers | delivery
// from/to: date range params

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    if (!type) {
      return NextResponse.json(
        { error: 'Report type is required. Use: sales, products, inventory, customers, delivery' },
        { status: 400 }
      )
    }

    // Default date range: last 30 days
    const now = new Date()
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateFrom = from ? new Date(from) : defaultFrom
    const dateTo = to ? new Date(to) : now

    switch (type) {
      case 'sales':
        return await getSalesReport(dateFrom, dateTo)
      case 'products':
        return await getProductsReport(dateFrom, dateTo)
      case 'inventory':
        return await getInventoryReport()
      case 'customers':
        return await getCustomersReport(dateFrom, dateTo)
      case 'delivery':
        return await getDeliveryReport(dateFrom, dateTo)
      default:
        return NextResponse.json(
          { error: `Unknown report type: ${type}. Use: sales, products, inventory, customers, delivery` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[REPORTS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Sales Report: daily aggregation for date range ───────────
async function getSalesReport(dateFrom: Date, dateTo: Date) {
  // Get all completed orders in date range
  const orders = await db.order.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { in: ['DELIVERED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'PROCESSING', 'READY_FOR_PICKUP'] },
    },
    select: {
      id: true,
      orderNumber: true,
      subtotal: true,
      discount: true,
      tax: true,
      deliveryFee: true,
      total: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      storeId: true,
      store: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Group by date
  const dailyData: Record<string, {
    date: string
    orderCount: number
    subtotal: number
    discount: number
    tax: number
    deliveryFee: number
    total: number
  }> = {}

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split('T')[0]
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        orderCount: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        deliveryFee: 0,
        total: 0,
      }
    }
    dailyData[dateKey].orderCount++
    dailyData[dateKey].subtotal += order.subtotal
    dailyData[dateKey].discount += order.discount
    dailyData[dateKey].tax += order.tax
    dailyData[dateKey].deliveryFee += order.deliveryFee
    dailyData[dateKey].total += order.total
  }

  // Summary
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Payment status breakdown
  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length
  const pendingOrders = orders.filter(o => o.paymentStatus === 'PENDING').length

  return NextResponse.json({
    data: {
      summary: {
        totalOrders,
        totalRevenue,
        totalDiscount,
        avgOrderValue,
        paidOrders,
        pendingOrders,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
      daily: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
    },
  })
}

// ─── Products Report: product performance from OrderItem ──────
async function getProductsReport(dateFrom: Date, dateTo: Date) {
  // Get order items in date range
  const orderItems = await db.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: dateFrom, lte: dateTo },
        status: { in: ['DELIVERED', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'PROCESSING', 'READY_FOR_PICKUP'] },
      },
    },
    select: {
      productId: true,
      name: true,
      sku: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      discount: true,
      order: {
        select: { id: true, createdAt: true },
      },
    },
  })

  // Aggregate by product
  const productMap: Record<string, {
    productId: string
    name: string
    sku: string
    totalQuantity: number
    totalRevenue: number
    totalDiscount: number
    orderCount: number
  }> = {}

  for (const item of orderItems) {
    if (!productMap[item.productId]) {
      productMap[item.productId] = {
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        totalQuantity: 0,
        totalRevenue: 0,
        totalDiscount: 0,
        orderCount: 0,
      }
    }
    productMap[item.productId].totalQuantity += item.quantity
    productMap[item.productId].totalRevenue += item.totalPrice
    productMap[item.productId].totalDiscount += item.discount
    productMap[item.productId].orderCount++
  }

  // Sort by revenue descending, take top 50
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 50)

  // Summary
  const totalItemsSold = orderItems.reduce((sum, i) => sum + i.quantity, 0)
  const totalProductRevenue = orderItems.reduce((sum, i) => sum + i.totalPrice, 0)
  const uniqueProducts = Object.keys(productMap).length

  return NextResponse.json({
    data: {
      summary: {
        totalItemsSold,
        totalProductRevenue,
        uniqueProducts,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
      topProducts,
    },
  })
}

// ─── Inventory Report: product inventory summary ──────────────
async function getInventoryReport() {
  const products = await db.product.findMany({
    where: { trackInventory: true },
    select: {
      id: true,
      name: true,
      sku: true,
      stockQty: true,
      minStockLevel: true,
      maxStockLevel: true,
      costPrice: true,
      retailPrice: true,
      unit: true,
      isActive: true,
      storeId: true,
      store: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      batches: {
        where: {
          expiryDate: { not: null },
        },
        select: {
          id: true,
          batchNumber: true,
          remainingQty: true,
          expiryDate: true,
        },
        orderBy: { expiryDate: 'asc' },
      },
    },
  })

  // Categorize products
  const lowStock = products.filter(p => p.stockQty <= p.minStockLevel && p.stockQty > 0)
  const outOfStock = products.filter(p => p.stockQty === 0)
  const overStock = products.filter(p => p.maxStockLevel !== null && p.stockQty > (p.maxStockLevel ?? 0))

  // Expiring soon (within 30 days)
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const expiringSoon = products.filter(p =>
    p.batches.some(b => b.expiryDate && b.expiryDate <= thirtyDaysFromNow)
  )

  // Summary
  const totalProducts = products.length
  const totalStockValue = products.reduce((sum, p) => sum + (p.stockQty * p.costPrice), 0)
  const totalRetailValue = products.reduce((sum, p) => sum + (p.stockQty * p.retailPrice), 0)

  return NextResponse.json({
    data: {
      summary: {
        totalProducts,
        totalStockValue,
        totalRetailValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        overStockCount: overStock.length,
        expiringSoonCount: expiringSoon.length,
      },
      lowStock: lowStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stockQty: p.stockQty,
        minStockLevel: p.minStockLevel,
        unit: p.unit,
        category: p.category.name,
      })),
      outOfStock: outOfStock.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
      })),
      expiringSoon: expiringSoon.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        batches: p.batches.filter(b => b.expiryDate && b.expiryDate <= thirtyDaysFromNow),
      })),
    },
  })
}

// ─── Customers Report: customer metrics ───────────────────────
async function getCustomersReport(dateFrom: Date, dateTo: Date) {
  // Total customers
  const totalCustomers = await db.user.count({
    where: { role: 'CUSTOMER' },
  })

  // Active customers (placed order in date range)
  const activeCustomerIds = await db.order.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
    },
    select: { customerId: true },
    distinct: ['customerId'],
  })

  const activeCustomers = activeCustomerIds.length

  // New customers (registered in date range)
  const newCustomers = await db.user.count({
    where: {
      role: 'CUSTOMER',
      createdAt: { gte: dateFrom, lte: dateTo },
    },
  })

  // Top customers by order value
  const topCustomers = await db.order.groupBy({
    by: ['customerId'],
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { in: ['DELIVERED', 'CONFIRMED', 'OUT_FOR_DELIVERY'] },
    },
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: 20,
  })

  // Enrich with customer details
  const enrichedTopCustomers = await Promise.all(
    topCustomers.map(async (entry) => {
      const user = await db.user.findUnique({
        where: { id: entry.customerId },
        select: { id: true, name: true, email: true, phone: true },
      })
      return {
        customer: user,
        totalSpent: entry._sum.total || 0,
        orderCount: entry._count.id,
      }
    })
  )

  // Loyalty stats
  const loyaltyStats = await db.loyaltyPoint.aggregate({
    _sum: { points: true, totalEarned: true, totalRedeemed: true },
    _count: true,
  })

  // Tier distribution
  const tierDistribution = await Promise.all(
    ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(async (tier) => {
      const count = await db.loyaltyPoint.count({
        where: { tier: tier as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' },
      })
      return { tier, count }
    })
  )

  return NextResponse.json({
    data: {
      summary: {
        totalCustomers,
        activeCustomers,
        newCustomers,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
      topCustomers: enrichedTopCustomers,
      loyalty: {
        totalPoints: loyaltyStats._sum.points || 0,
        totalEarned: loyaltyStats._sum.totalEarned || 0,
        totalRedeemed: loyaltyStats._sum.totalRedeemed || 0,
        membersCount: loyaltyStats._count,
        tierDistribution,
      },
    },
  })
}

// ─── Delivery Report: delivery metrics ────────────────────────
async function getDeliveryReport(dateFrom: Date, dateTo: Date) {
  // Delivery trips in date range
  const trips = await db.deliveryTrip.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
    },
    select: {
      id: true,
      status: true,
      earnings: true,
      createdAt: true,
      pickupAt: true,
      deliveredAt: true,
      riderId: true,
      rider: { select: { id: true, name: true } },
    },
  })

  // Status breakdown
  const statusCounts: Record<string, number> = {}
  for (const trip of trips) {
    statusCounts[trip.status] = (statusCounts[trip.status] || 0) + 1
  }

  // Calculate delivery times (from creation to delivered)
  const completedTrips = trips.filter(
    t => t.status === 'DELIVERED' && t.deliveredAt && t.createdAt
  )
  const deliveryTimes = completedTrips.map(t => {
    const time = t.deliveredAt!.getTime() - t.createdAt.getTime()
    return time / (1000 * 60) // in minutes
  })
  const avgDeliveryTime = deliveryTimes.length > 0
    ? deliveryTimes.reduce((sum, t) => sum + t, 0) / deliveryTimes.length
    : 0

  // Rider performance
  const riderMap: Record<string, {
    riderId: string
    riderName: string
    totalTrips: number
    completedTrips: number
    failedTrips: number
    totalEarnings: number
  }> = {}

  for (const trip of trips) {
    if (!riderMap[trip.riderId]) {
      riderMap[trip.riderId] = {
        riderId: trip.riderId,
        riderName: trip.rider.name,
        totalTrips: 0,
        completedTrips: 0,
        failedTrips: 0,
        totalEarnings: 0,
      }
    }
    riderMap[trip.riderId].totalTrips++
    if (trip.status === 'DELIVERED') {
      riderMap[trip.riderId].completedTrips++
      riderMap[trip.riderId].totalEarnings += trip.earnings
    }
    if (trip.status === 'FAILED') {
      riderMap[trip.riderId].failedTrips++
    }
  }

  const totalEarnings = trips.reduce((sum, t) => sum + t.earnings, 0)
  const deliveryRate = trips.length > 0
    ? (statusCounts['DELIVERED'] || 0) / trips.length * 100
    : 0

  return NextResponse.json({
    data: {
      summary: {
        totalTrips: trips.length,
        statusCounts,
        avgDeliveryTime: Math.round(avgDeliveryTime * 10) / 10,
        totalEarnings,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      },
      riderPerformance: Object.values(riderMap).sort(
        (a, b) => b.completedTrips - a.completedTrips
      ),
    },
  })
}
