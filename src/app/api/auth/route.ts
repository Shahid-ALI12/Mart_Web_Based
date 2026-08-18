import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ─── POST /api/auth — Login ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        passwordHash: true,
        storeId: true,
        lastLoginAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    // Compare password — stored as base64 in demo
    const encodedPassword = Buffer.from(password).toString('base64')
    if (user.passwordHash !== encodedPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Update last login timestamp (non-blocking, ignore errors on read-only FS)
    db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {/* ignore write errors on read-only FS (Vercel) */})

    // Return user data without password hash
    const { passwordHash: _, ...safeUser } = user

    return NextResponse.json({
      user: safeUser,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('[AUTH] Login error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    // Check for common database errors
    if (message.includes('prisma') || message.includes('database') || message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please ensure the database is properly configured and seeded.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── DELETE /api/auth — Logout ────────────────────────────────
export async function DELETE() {
  try {
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('[AUTH] Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
