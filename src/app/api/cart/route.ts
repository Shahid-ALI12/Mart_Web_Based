import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// ─── Validation Schemas ───────────────────────────────────────
const AddToCartSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
})

const UpdateCartItemSchema = z.object({
  cartItemId: z.string().min(1, 'Cart item ID is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
})

const RemoveCartItemSchema = z.object({
  cartItemId: z.string().min(1, 'Cart item ID is required'),
  userId: z.string().min(1, 'User ID is required'),
})

// ─── GET /api/cart — Get cart for user ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || ''

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Find or create cart
    let cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                retailPrice: true,
                salePrice: true,
                stockQty: true,
                isActive: true,
                unit: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      })
    }

    // Compute totals
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      data: cart,
      meta: { subtotal, itemCount },
    })
  } catch (error) {
    console.error('[CART] Get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/cart — Add item to cart ────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AddToCartSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { userId, productId, variantId, quantity } = parsed.data

    // Verify product exists and is active
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, retailPrice: true, salePrice: true, stockQty: true, isActive: true },
    })

    if (!product || !product.isActive) {
      return NextResponse.json({ error: 'Product not available' }, { status: 404 })
    }

    if (product.stockQty < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.stockQty}` },
        { status: 400 }
      )
    }

    // Determine unit price
    let unitPrice = product.salePrice ?? product.retailPrice

    // If variant specified, get variant price
    if (variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: variantId },
      })
      if (!variant || !variant.isActive) {
        return NextResponse.json({ error: 'Variant not available' }, { status: 404 })
      }
      unitPrice = variant.salePrice ?? variant.retailPrice
    }

    const totalPrice = unitPrice * quantity

    // Find or create cart
    let cart = await db.cart.findUnique({ where: { userId } })
    if (!cart) {
      cart = await db.cart.create({ data: { userId } })
    }

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      const newTotalPrice = unitPrice * newQuantity
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity, unitPrice, totalPrice: newTotalPrice },
      })
    } else {
      // Add new item
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || undefined,
          quantity,
          unitPrice,
          totalPrice,
        },
      })
    }

    // Return updated cart
    const updatedCart = await db.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                retailPrice: true,
                salePrice: true,
                stockQty: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    const subtotal = updatedCart!.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const itemCount = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      data: updatedCart,
      meta: { subtotal, itemCount },
    })
  } catch (error) {
    console.error('[CART] Add error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PUT /api/cart — Update cart item quantity ────────────────
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = UpdateCartItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { cartItemId, quantity } = parsed.data

    const cartItem = await db.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    })

    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      await db.cartItem.delete({ where: { id: cartItemId } })
    } else {
      const totalPrice = cartItem.unitPrice * quantity
      await db.cartItem.update({
        where: { id: cartItemId },
        data: { quantity, totalPrice },
      })
    }

    // Return updated cart
    const updatedCart = await db.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                retailPrice: true,
                salePrice: true,
                stockQty: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    const subtotal = updatedCart!.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const itemCount = updatedCart!.items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      data: updatedCart,
      meta: { subtotal, itemCount },
    })
  } catch (error) {
    console.error('[CART] Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/cart — Remove item from cart ─────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cartItemId = searchParams.get('cartItemId') || ''
    const userId = searchParams.get('userId') || ''

    if (!cartItemId || !userId) {
      return NextResponse.json({ error: 'cartItemId and userId are required' }, { status: 400 })
    }

    const cartItem = await db.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    })

    if (!cartItem || cartItem.cart.userId !== userId) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 })
    }

    await db.cartItem.delete({ where: { id: cartItemId } })

    // Return updated cart
    const updatedCart = await db.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                retailPrice: true,
                salePrice: true,
                stockQty: true,
                unit: true,
              },
            },
          },
        },
      },
    })

    const subtotal = (updatedCart?.items || []).reduce((sum, item) => sum + item.totalPrice, 0)
    const itemCount = (updatedCart?.items || []).reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      data: updatedCart,
      meta: { subtotal, itemCount },
    })
  } catch (error) {
    console.error('[CART] Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
