import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// ─── Validation Schemas ───────────────────────────────────────
const MarkReadSchema = z.object({
  id: z.string().optional(), // single notification ID
  markAll: z.boolean().optional(), // mark all as read for user
})

const DeleteSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
})

// ─── GET /api/notifications — Get user notifications ──────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const type = searchParams.get('type') || ''
    const isRead = searchParams.get('isRead')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const where: Prisma.NotificationWhereInput = {
      userId,
    }

    if (type) where.type = type as Prisma.EnumNotificationTypeFilter
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true'
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ])

    return NextResponse.json({
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] List error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/notifications — Mark as read ────────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = MarkReadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = parsed.data

    if (data.markAll && !data.id) {
      // Need userId for markAll — get from query or body
      const { searchParams } = new URL(request.url)
      const userId = searchParams.get('userId') || body.userId

      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required to mark all as read' },
          { status: 400 }
        )
      }

      const result = await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({
        data: { markedCount: result.count },
        message: `${result.count} notifications marked as read`,
      })
    }

    if (data.id) {
      const notification = await db.notification.findUnique({
        where: { id: data.id },
      })

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      const updated = await db.notification.update({
        where: { id: data.id },
        data: { isRead: true },
      })

      return NextResponse.json({ data: updated })
    }

    return NextResponse.json(
      { error: 'Provide either id or markAll with userId' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/notifications — Delete notification ──────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''

    if (!id) {
      // Try to parse from body
      try {
        const body = await request.json()
        const parsed = DeleteSchema.safeParse(body)

        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Notification ID is required' },
            { status: 400 }
          )
        }

        const notification = await db.notification.findUnique({
          where: { id: parsed.data.id },
        })

        if (!notification) {
          return NextResponse.json(
            { error: 'Notification not found' },
            { status: 404 }
          )
        }

        await db.notification.delete({ where: { id: parsed.data.id } })

        return NextResponse.json({
          data: { id: parsed.data.id },
          message: 'Notification deleted',
        })
      } catch {
        return NextResponse.json(
          { error: 'Notification ID is required' },
          { status: 400 }
        )
      }
    }

    const notification = await db.notification.findUnique({
      where: { id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await db.notification.delete({ where: { id } })

    return NextResponse.json({
      data: { id },
      message: 'Notification deleted',
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
