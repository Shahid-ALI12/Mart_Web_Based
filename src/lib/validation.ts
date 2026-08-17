// ============================================================
// MEGA MART — Zod Validation Schemas
// Production-grade input validation for all API endpoints
// ============================================================

import { z } from 'zod';

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(5000).optional(),
  shortDesc: z.string().max(300).optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional(),
  brand: z.string().max(100).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  nutritionInfo: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  costPrice: z.number().min(0, 'Cost price cannot be negative').optional(),
  retailPrice: z.number().positive('Retail price must be positive'),
  salePrice: z.number().positive('Sale price must be positive').optional(),
  markup: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  stockQty: z.number().int().min(0).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).optional(),
  unit: z.enum(['piece', 'kg', 'liter', 'pack']).optional(),
  weight: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  storeId: z.string().min(1, 'Store is required'),
  supplierId: z.string().optional(),
});

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────

export const orderCreateSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  customerId: z.string().min(1, 'Customer is required'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        variantId: z.string().optional(),
        quantity: z.number().int().positive('Quantity must be at least 1'),
        unitPrice: z.number().positive('Unit price must be positive'),
      }),
    )
    .min(1, 'Order must have at least one item'),
  deliveryAddressId: z.string().optional(),
  deliveryNotes: z.string().max(500).optional(),
  deliveryTimeSlot: z.string().max(200).optional(),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']).optional(),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'JAZZCASH', 'EASYPAYSA', 'BANK_TRANSFER', 'WALLET', 'SPLIT'])
    .optional(),
  couponCode: z.string().max(50).optional(),
  promotionId: z.string().optional(),
  loyaltyPointsUsed: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

// ──────────────────────────────────────────────
// Cart
// ──────────────────────────────────────────────

export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Maximum 99 per item'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

// ──────────────────────────────────────────────
// Promotions
// ──────────────────────────────────────────────

export const promotionCreateSchema = z
  .object({
    storeId: z.string().min(1, 'Store is required'),
    name: z.string().min(1, 'Promotion name is required').max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED', 'BOGO', 'BUNDLE']),
    value: z.number().positive('Promotion value must be positive'),
    minOrder: z.number().min(0).optional(),
    maxDiscount: z.number().positive().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().optional(),
    usageLimit: z.number().int().positive().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
  })
  .refine(
    (data) => {
      if (data.type === 'PERCENTAGE' && data.value > 100) return false;
      return true;
    },
    { message: 'Percentage discount cannot exceed 100%' },
  );

// ──────────────────────────────────────────────
// Coupons
// ──────────────────────────────────────────────

export const couponCreateSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Coupon code is required')
      .max(50)
      .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
    promotionId: z.string().optional(),
    discountType: z.enum(['PERCENTAGE', 'FIXED', 'BOGO', 'BUNDLE']).optional(),
    discountValue: z.number().positive('Discount value must be positive'),
    minOrder: z.number().min(0).optional(),
    maxDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
  })
  .refine(
    (data) => {
      if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) return false;
      return true;
    },
    { message: 'Percentage discount cannot exceed 100%' },
  );

// ──────────────────────────────────────────────
// Suppliers
// ──────────────────────────────────────────────

export const supplierCreateSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(200),
  code: z
    .string()
    .min(1, 'Supplier code is required')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  contactName: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

// ──────────────────────────────────────────────
// Delivery Zones
// ──────────────────────────────────────────────

export const deliveryZoneSchema = z.object({
  storeId: z.string().min(1, 'Store is required'),
  name: z.string().min(1, 'Zone name is required').max(100),
  minOrder: z.number().min(0, 'Minimum order cannot be negative').optional(),
  deliveryFee: z.number().min(0, 'Delivery fee cannot be negative').optional(),
  estimatedMinutes: z.number().int().min(1, 'Must be at least 1 minute').max(180, 'Max 3 hours').optional(),
  isActive: z.boolean().optional(),
});

// ──────────────────────────────────────────────
// Type exports for inferred types
// ──────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type PromotionCreateInput = z.infer<typeof promotionCreateSchema>;
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;
export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
