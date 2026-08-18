// ============================================================
// MEGA MART — Seed Data
// Populates the database with realistic demo data
// ============================================================

import { db } from '../src/lib/db';
import { hash } from 'crypto';

// Simple password hash for demo (in production use bcrypt)
function simpleHash(password: string): string {
  return Buffer.from(password).toString('base64');
}

async function main() {
  console.log('🌱 Seeding Mega Mart database...');

  // Clean existing data
  await db.usageLog.deleteMany();
  await db.invoice.deleteMany();
  await db.subscription.deleteMany();
  await db.license.deleteMany();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.posTransaction.deleteMany();
  await db.posShift.deleteMany();
  await db.coupon.deleteMany();
  await db.promotion.deleteMany();
  await db.deliveryTrip.deleteMany();
  await db.purchaseOrderItem.deleteMany();
  await db.purchaseOrder.deleteMany();
  await db.walletTransaction.deleteMany();
  await db.wallet.deleteMany();
  await db.loyaltyPoint.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.review.deleteMany();
  await db.orderTimeline.deleteMany();
  await db.orderItem.deleteMany();
  await db.payment.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.address.deleteMany();
  await db.productBatch.deleteMany();
  await db.productVariant.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.supplier.deleteMany();
  await db.deliveryZone.deleteMany();
  await db.storeSetting.deleteMany();
  await db.user.deleteMany();
  await db.store.deleteMany();

  // ============================================================
  // STORE
  // ============================================================
  const store = await db.store.create({
    data: {
      name: 'Mega Mart',
      slug: 'mega-mart',
      description: 'Your one-stop shop for everything — fresh groceries, electronics, household, and more!',
      phone: '+92-300-1234567',
      email: 'info@megamart.pk',
      address: 'Main Boulevard, Gulberg III, Lahore',
      city: 'Lahore',
      latitude: 31.5204,
      longitude: 74.3587,
      currency: 'PKR',
      taxRate: 0.17,
      timezone: 'Asia/Karachi',
      isActive: true,
    },
  });
  console.log('✅ Store created');

  // ============================================================
  // DELIVERY ZONES
  // ============================================================
  await db.deliveryZone.createMany({
    data: [
      { storeId: store.id, name: 'Gulberg', minOrder: 500, deliveryFee: 0, estimatedMinutes: 25 },
      { storeId: store.id, name: 'DHA', minOrder: 800, deliveryFee: 50, estimatedMinutes: 35 },
      { storeId: store.id, name: 'Model Town', minOrder: 600, deliveryFee: 30, estimatedMinutes: 30 },
      { storeId: store.id, name: 'Johar Town', minOrder: 1000, deliveryFee: 80, estimatedMinutes: 45 },
    ],
  });
  console.log('✅ Delivery zones created');

  // ============================================================
  // USERS
  // ============================================================
  const users = await Promise.all([
    db.user.create({
      data: {
        email: 'admin@megamart.pk', name: 'Ali Khan', phone: '+92-301-1111111',
        passwordHash: simpleHash('admin123'), role: 'SUPER_ADMIN', storeId: store.id,
        isActive: true, emailVerified: true, phoneVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: 'manager@megamart.pk', name: 'Sara Ahmed', phone: '+92-302-2222222',
        passwordHash: simpleHash('manager123'), role: 'STORE_MANAGER', storeId: store.id,
        isActive: true, emailVerified: true, phoneVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: 'cashier@megamart.pk', name: 'Usman Malik', phone: '+92-303-3333333',
        passwordHash: simpleHash('cashier123'), role: 'CASHIER', storeId: store.id,
        isActive: true, emailVerified: true, phoneVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: 'rider@megamart.pk', name: 'Kamran Shah', phone: '+92-304-4444444',
        passwordHash: simpleHash('rider123'), role: 'RIDER', storeId: store.id,
        isActive: true, emailVerified: true, phoneVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: 'warehouse@megamart.pk', name: 'Farhan Ali', phone: '+92-305-5555555',
        passwordHash: simpleHash('warehouse123'), role: 'WAREHOUSE', storeId: store.id,
        isActive: true, emailVerified: true, phoneVerified: true,
      },
    }),
    db.user.create({
      data: {
        email: 'customer@test.com', name: 'Ayesha Tariq', phone: '+92-306-6666666',
        passwordHash: simpleHash('customer123'), role: 'CUSTOMER',
        isActive: true, emailVerified: true, phoneVerified: true,
      },
    }),
  ]);
  console.log('✅ Users created (admin, manager, cashier, rider, warehouse, customer)');

  // Customer wallet & loyalty
  await db.wallet.create({ data: { userId: users[5].id, balance: 2000 } });
  await db.loyaltyPoint.create({ data: { userId: users[5].id, points: 500, tier: 'SILVER', totalEarned: 500 } });

  // Customer address
  await db.address.create({
    data: {
      userId: users[5].id, label: 'Home', address: '42-B, Main Market',
      city: 'Lahore', area: 'Gulberg III', latitude: 31.5230, longitude: 74.3574, isDefault: true,
    },
  });

  // ============================================================
  // SUPPLIERS
  // ============================================================
  const suppliers = await Promise.all([
    db.supplier.create({ data: { name: 'Nestlé Pakistan', code: 'NEST-001', contactName: 'Imran Bhatti', phone: '+92-311-1111111', email: 'orders@nestle.pk' } }),
    db.supplier.create({ data: { name: 'Unilever Pakistan', code: 'UNIL-001', contactName: 'Naveed Akram', phone: '+92-312-2222222', email: 'supply@unilever.pk' } }),
    db.supplier.create({ data: { name: 'PepsiCo International', code: 'PEPS-001', contactName: 'Hassan Raza', phone: '+92-313-3333333', email: 'orders@pepsico.pk' } }),
    db.supplier.create({ data: { name: 'Engro Foods', code: 'ENGRO-001', contactName: 'Bilal Siddiqui', phone: '+92-314-4444444', email: 'supply@engro.pk' } }),
  ]);
  console.log('✅ Suppliers created');

  // ============================================================
  // CATEGORIES
  // ============================================================
  const categories = await Promise.all([
    // Top-level
    db.category.create({ data: { name: 'Groceries & Staples', slug: 'groceries', icon: '🛒', storeId: store.id, sortOrder: 1 } }),
    db.category.create({ data: { name: 'Fresh Produce', slug: 'fresh-produce', icon: '🥬', storeId: store.id, sortOrder: 2 } }),
    db.category.create({ data: { name: 'Dairy & Breakfast', slug: 'dairy', icon: '🥛', storeId: store.id, sortOrder: 3 } }),
    db.category.create({ data: { name: 'Beverages', slug: 'beverages', icon: '🥤', storeId: store.id, sortOrder: 4 } }),
    db.category.create({ data: { name: 'Snacks & Confectionery', slug: 'snacks', icon: '🍪', storeId: store.id, sortOrder: 5 } }),
    db.category.create({ data: { name: 'Household', slug: 'household', icon: '🏠', storeId: store.id, sortOrder: 6 } }),
    db.category.create({ data: { name: 'Personal Care', slug: 'personal-care', icon: '🧴', storeId: store.id, sortOrder: 7 } }),
    db.category.create({ data: { name: 'Electronics', slug: 'electronics', icon: '📱', storeId: store.id, sortOrder: 8 } }),
  ]);

  // Sub-categories
  await Promise.all([
    db.category.create({ data: { name: 'Rice & Grains', slug: 'rice-grains', parentId: categories[0].id, storeId: store.id, sortOrder: 1 } }),
    db.category.create({ data: { name: 'Flour & Atta', slug: 'flour-atta', parentId: categories[0].id, storeId: store.id, sortOrder: 2 } }),
    db.category.create({ data: { name: 'Cooking Oil', slug: 'cooking-oil', parentId: categories[0].id, storeId: store.id, sortOrder: 3 } }),
    db.category.create({ data: { name: 'Spices', slug: 'spices', parentId: categories[0].id, storeId: store.id, sortOrder: 4 } }),
    db.category.create({ data: { name: 'Fruits', slug: 'fruits', parentId: categories[1].id, storeId: store.id, sortOrder: 1 } }),
    db.category.create({ data: { name: 'Vegetables', slug: 'vegetables', parentId: categories[1].id, storeId: store.id, sortOrder: 2 } }),
    db.category.create({ data: { name: 'Milk & Cream', slug: 'milk-cream', parentId: categories[2].id, storeId: store.id, sortOrder: 1 } }),
    db.category.create({ data: { name: 'Yogurt & Lassi', slug: 'yogurt-lassi', parentId: categories[2].id, storeId: store.id, sortOrder: 2 } }),
    db.category.create({ data: { name: 'Soft Drinks', slug: 'soft-drinks', parentId: categories[3].id, storeId: store.id, sortOrder: 1 } }),
    db.category.create({ data: { name: 'Juices', slug: 'juices', parentId: categories[3].id, storeId: store.id, sortOrder: 2 } }),
    db.category.create({ data: { name: 'Tea & Coffee', slug: 'tea-coffee', parentId: categories[3].id, storeId: store.id, sortOrder: 3 } }),
  ]);
  console.log('✅ Categories created (8 top-level + 11 sub)');

  // ============================================================
  // PRODUCTS (50+ items for realistic demo)
  // ============================================================
  const productList = [
    // Groceries
    { name: 'Basmati Rice 5kg', slug: 'basmati-rice-5kg', sku: 'GRC-RICE-001', barcode: '8901234567890', retailPrice: 1200, costPrice: 980, categoryId: categories[0].id, unit: 'piece', stockQty: 150, isBestSeller: true, brand: 'Guard' },
    { name: 'Wheat Atta 10kg', slug: 'wheat-atta-10kg', sku: 'GRC-ATTA-001', barcode: '8901234567891', retailPrice: 850, costPrice: 720, categoryId: categories[0].id, unit: 'piece', stockQty: 200, isBestSeller: true, brand: 'Ashrafi' },
    { name: 'Cooking Oil 5L', slug: 'cooking-oil-5l', sku: 'GRC-OIL-001', barcode: '8901234567892', retailPrice: 2800, costPrice: 2500, categoryId: categories[0].id, unit: 'piece', stockQty: 80, brand: 'Sufi' },
    { name: 'Sugar 5kg', slug: 'sugar-5kg', sku: 'GRC-SUG-001', barcode: '8901234567893', retailPrice: 650, costPrice: 580, categoryId: categories[0].id, unit: 'piece', stockQty: 120, brand: 'Refined' },
    { name: 'Salt 800g', slug: 'salt-800g', sku: 'GRC-SLT-001', barcode: '8901234567894', retailPrice: 45, costPrice: 30, categoryId: categories[0].id, unit: 'piece', stockQty: 300, brand: 'National' },

    // Fresh Produce
    { name: 'Fresh Bananas 1kg', slug: 'fresh-bananas-1kg', sku: 'FP-BAN-001', retailPrice: 120, costPrice: 80, categoryId: categories[1].id, unit: 'kg', stockQty: 50, isNewArrival: true },
    { name: 'Red Apples 1kg', slug: 'red-apples-1kg', sku: 'FP-APL-001', retailPrice: 350, costPrice: 280, categoryId: categories[1].id, unit: 'kg', stockQty: 40, isFeatured: true },
    { name: 'Tomatoes 1kg', slug: 'tomatoes-1kg', sku: 'FP-TOM-001', retailPrice: 80, costPrice: 50, categoryId: categories[1].id, unit: 'kg', stockQty: 80 },
    { name: 'Onions 1kg', slug: 'onions-1kg', sku: 'FP-ONI-001', retailPrice: 100, costPrice: 65, categoryId: categories[1].id, unit: 'kg', stockQty: 100, isBestSeller: true },
    { name: 'Potatoes 1kg', slug: 'potatoes-1kg', sku: 'FP-POT-001', retailPrice: 60, costPrice: 40, categoryId: categories[1].id, unit: 'kg', stockQty: 120 },

    // Dairy
    { name: 'Fresh Milk 1L', slug: 'fresh-milk-1l', sku: 'DY-MLK-001', barcode: '8901234567900', retailPrice: 220, costPrice: 180, categoryId: categories[2].id, unit: 'piece', stockQty: 200, isBestSeller: true, brand: 'Nestlé' },
    { name: 'Yogurt 400g', slug: 'yogurt-400g', sku: 'DY-YRT-001', barcode: '8901234567901', retailPrice: 120, costPrice: 90, categoryId: categories[2].id, unit: 'piece', stockQty: 150, brand: 'Nestlé' },
    { name: 'Butter 200g', slug: 'butter-200g', sku: 'DY-BTR-001', barcode: '8901234567902', retailPrice: 350, costPrice: 290, categoryId: categories[2].id, unit: 'piece', stockQty: 60, brand: 'Olper\'s' },
    { name: 'Cream Cheese 150g', slug: 'cream-cheese-150g', sku: 'DY-CCH-001', barcode: '8901234567903', retailPrice: 280, costPrice: 220, categoryId: categories[2].id, unit: 'piece', stockQty: 40, brand: 'Philadelphia' },

    // Beverages
    { name: 'Pepsi 1.5L', slug: 'pepsi-1.5l', sku: 'BV-PEP-001', barcode: '8901234567910', retailPrice: 120, costPrice: 85, categoryId: categories[3].id, unit: 'piece', stockQty: 300, isBestSeller: true, brand: 'Pepsi' },
    { name: 'Coca-Cola 1.5L', slug: 'coca-cola-1.5l', sku: 'BV-COK-001', barcode: '8901234567911', retailPrice: 120, costPrice: 85, categoryId: categories[3].id, unit: 'piece', stockQty: 280, isBestSeller: true, brand: 'Coca-Cola' },
    { name: 'Mango Juice 1L', slug: 'mango-juice-1l', sku: 'BV-MNG-001', barcode: '8901234567912', retailPrice: 180, costPrice: 130, categoryId: categories[3].id, unit: 'piece', stockQty: 100, brand: 'Slice' },
    { name: 'Tapal Danedar 950g', slug: 'tapal-danedar-950g', sku: 'BV-TEA-001', barcode: '8901234567913', retailPrice: 1050, costPrice: 900, categoryId: categories[3].id, unit: 'piece', stockQty: 80, isBestSeller: true, brand: 'Tapal' },
    { name: 'Nescafé Classic 200g', slug: 'nescafe-classic-200g', sku: 'BV-COF-001', barcode: '8901234567914', retailPrice: 850, costPrice: 700, categoryId: categories[3].id, unit: 'piece', stockQty: 50, isFeatured: true, brand: 'Nestlé' },
    { name: 'Aqua Fina 1.5L', slug: 'aqua-fina-1.5l', sku: 'BV-WTR-001', barcode: '8901234567915', retailPrice: 60, costPrice: 35, categoryId: categories[3].id, unit: 'piece', stockQty: 500, brand: 'Nestlé' },

    // Snacks
    { name: 'Kurkure 70g', slug: 'kurkure-70g', sku: 'SN-KRK-001', barcode: '8901234567920', retailPrice: 50, costPrice: 35, categoryId: categories[4].id, unit: 'piece', stockQty: 400, brand: 'Kurkure' },
    { name: 'Lays Classic 52g', slug: 'lays-classic-52g', sku: 'SN-LAY-001', barcode: '8901234567921', retailPrice: 60, costPrice: 42, categoryId: categories[4].id, unit: 'piece', stockQty: 350, isBestSeller: true, brand: 'Lays' },
    { name: 'Cadbury Dairy Milk 48g', slug: 'cadbury-dairy-milk-48g', sku: 'SN-CDM-001', barcode: '8901234567922', retailPrice: 100, costPrice: 75, categoryId: categories[4].id, unit: 'piece', stockQty: 200, brand: 'Cadbury' },
    { name: 'Biscuit Party Pack', slug: 'biscuit-party-pack', sku: 'SN-BIS-001', barcode: '8901234567923', retailPrice: 150, costPrice: 110, categoryId: categories[4].id, unit: 'piece', stockQty: 120, brand: 'LU' },

    // Household
    { name: 'Surf Excel 1kg', slug: 'surf-excel-1kg', sku: 'HH-SE-001', barcode: '8901234567930', retailPrice: 450, costPrice: 370, categoryId: categories[5].id, unit: 'piece', stockQty: 100, isBestSeller: true, brand: 'Surf Excel' },
    { name: 'Harpic 500ml', slug: 'harpic-500ml', sku: 'HH-HRP-001', barcode: '8901234567931', retailPrice: 280, costPrice: 210, categoryId: categories[5].id, unit: 'piece', stockQty: 80, brand: 'Harpic' },
    { name: 'Vim Dishwash 750ml', slug: 'vim-dishwash-750ml', sku: 'HH-VIM-001', barcode: '8901234567932', retailPrice: 220, costPrice: 170, categoryId: categories[5].id, unit: 'piece', stockQty: 90, brand: 'Vim' },
    { name: 'Tissue Paper Roll', slug: 'tissue-paper-roll', sku: 'HH-TIS-001', barcode: '8901234567933', retailPrice: 80, costPrice: 50, categoryId: categories[5].id, unit: 'piece', stockQty: 200 },

    // Personal Care
    { name: 'Sunsilk Shampoo 180ml', slug: 'sunsilk-shampoo-180ml', sku: 'PC-SUN-001', barcode: '8901234567940', retailPrice: 250, costPrice: 190, categoryId: categories[6].id, unit: 'piece', stockQty: 60, brand: 'Sunsilk' },
    { name: 'Colgate 100g', slug: 'colgate-100g', sku: 'PC-COL-001', barcode: '8901234567941', retailPrice: 180, costPrice: 130, categoryId: categories[6].id, unit: 'piece', stockQty: 100, isBestSeller: true, brand: 'Colgate' },
    { name: 'Lifebuoy Soap 100g', slug: 'lifebuoy-soap-100g', sku: 'PC-LB-001', barcode: '8901234567942', retailPrice: 45, costPrice: 30, categoryId: categories[6].id, unit: 'piece', stockQty: 250, brand: 'Lifebuoy' },

    // Electronics (limited for mart)
    { name: 'AAA Batteries 4-Pack', slug: 'aaa-batteries-4pack', sku: 'EL-BAT-001', barcode: '8901234567950', retailPrice: 350, costPrice: 260, categoryId: categories[7].id, unit: 'piece', stockQty: 40, brand: 'Duracell' },
    { name: 'LED Bulb 12W', slug: 'led-bulb-12w', sku: 'EL-LED-001', barcode: '8901234567951', retailPrice: 250, costPrice: 180, categoryId: categories[7].id, unit: 'piece', stockQty: 50 },
    { name: 'Phone Charger USB-C', slug: 'phone-charger-usbc', sku: 'EL-CHG-001', barcode: '8901234567952', retailPrice: 600, costPrice: 400, categoryId: categories[7].id, unit: 'piece', stockQty: 30, isFeatured: true },
  ];

  const products = await Promise.all(
    productList.map((p) =>
      db.product.create({
        data: {
          ...p,
          barcode: p.barcode || null,
          storeId: store.id,
          supplierId: suppliers[Math.floor(Math.random() * suppliers.length)].id,
          minStockLevel: 5,
          images: '[]',
          tags: '[]',
          markup: p.costPrice > 0 ? ((p.retailPrice - p.costPrice) / p.costPrice) * 100 : 0,
        },
      })
    )
  );
  console.log(`✅ Products created (${products.length} items)`);

  // ============================================================
  // PROMOTIONS & COUPONS
  // ============================================================
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db.promotion.create({
    data: {
      storeId: store.id, name: 'Summer Sale - 15% Off', description: 'Get 15% off on all items!',
      type: 'PERCENTAGE', value: 15, minOrder: 1000, maxDiscount: 500,
      startDate: now, endDate: nextMonth, isActive: true,
    },
  });

  await db.coupon.create({
    data: {
      code: 'MEGA100', discountType: 'FIXED', discountValue: 100,
      minOrder: 500, usageLimit: 100, isActive: true,
      startDate: now, endDate: nextMonth,
    },
  });

  await db.coupon.create({
    data: {
      code: 'FIRST20', discountType: 'PERCENTAGE', discountValue: 20,
      minOrder: 1000, maxDiscount: 300, perUserLimit: 1, usageLimit: 50, isActive: true,
      startDate: now, endDate: nextMonth,
    },
  });
  console.log('✅ Promotions & coupons created');

  // ============================================================
  // LICENSE (SaaS)
  // ============================================================
  const trialStart = now;
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const license = await db.license.create({
    data: {
      key: 'MM-TRIAL-' + Date.now().toString(36).toUpperCase(),
      storeId: store.id,
      plan: 'PROFESSIONAL',
      status: 'TRIAL',
      features: JSON.stringify({
        ecommerce: true, pos: true, inventory: true, delivery: true,
        reports: true, promotions: true, loyalty: true, multiStore: false,
      }),
      maxStores: 1,
      maxUsers: 10,
      maxPosTerminals: 3,
      trialStartsAt: trialStart,
      trialEndsAt: trialEnd,
    },
  });
  console.log('✅ License created (14-day Professional trial)');

  // ============================================================
  // DEMO ORDER
  // ============================================================
  const customer = users[5];
  const address = await db.address.findFirst({ where: { userId: customer.id } });

  const order = await db.order.create({
    data: {
      orderNumber: 'MM-000001',
      storeId: store.id,
      customerId: customer.id,
      subtotal: 1870,
      discount: 100,
      tax: 300.9,
      deliveryFee: 0,
      total: 2070.9,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      fulfillmentType: 'DELIVERY',
      paymentMethod: 'JAZZCASH',
      deliveryAddressId: address?.id,
      deliveryTimeSlot: JSON.stringify({ date: '2026-08-16', from: '14:00', to: '16:00' }),
      items: {
        create: [
          { productId: products[0].id, name: 'Basmati Rice 5kg', sku: 'GRC-RICE-001', quantity: 1, unitPrice: 1200, totalPrice: 1200 },
          { productId: products[15].id, name: 'Pepsi 1.5L', sku: 'BV-PEP-001', quantity: 2, unitPrice: 120, totalPrice: 240 },
          { productId: products[10].id, name: 'Fresh Milk 1L', sku: 'DY-MLK-001', quantity: 1, unitPrice: 220, totalPrice: 220 },
          { productId: products[22].id, name: 'Lays Classic 52g', sku: 'SN-LAY-001', quantity: 3, unitPrice: 60, totalPrice: 180 },
          { productId: products[3].id, name: 'Sugar 5kg', sku: 'GRC-SUG-001', quantity: 1, unitPrice: 650, totalPrice: 650 },
        ],
      },
      timeline: {
        create: [
          { status: 'PENDING', note: 'Order placed', createdBy: customer.id },
          { status: 'CONFIRMED', note: 'Order confirmed by store' },
          { status: 'PROCESSING', note: 'Order being prepared' },
          { status: 'OUT_FOR_DELIVERY', note: 'Rider picked up order' },
          { status: 'DELIVERED', note: 'Order delivered successfully' },
        ],
      },
    },
  });

  // Add payment for the order
  await db.payment.create({
    data: {
      orderId: order.id, method: 'JAZZCASH', amount: 2070.9,
      status: 'PAID', transactionRef: 'JZ-' + Date.now(),
      paidAt: new Date(),
    },
  });
  console.log('✅ Demo order created');

  // ============================================================
  // NOTIFICATIONS
  // ============================================================
  await db.notification.createMany({
    data: [
      { userId: customer.id, title: 'Order Delivered!', message: 'Your order MM-000001 has been delivered. Thank you for shopping!', type: 'ORDER', data: JSON.stringify({ orderId: order.id }) },
      { userId: customer.id, title: 'Welcome to Mega Mart!', message: 'Use code FIRST20 for 20% off on your first order above Rs. 1,000!', type: 'PROMOTION' },
      { userId: users[1].id, title: 'Low Stock Alert', message: 'Phone Charger USB-C stock is below minimum level (30 units)', type: 'LOW_STOCK' },
    ],
  });
  console.log('✅ Notifications created');

  // ============================================================
  // STORE SETTINGS
  // ============================================================
  await db.storeSetting.createMany({
    data: [
      { storeId: store.id, key: 'store_open', value: '08:00' },
      { storeId: store.id, key: 'store_close', value: '22:00' },
      { storeId: store.id, key: 'delivery_enabled', value: 'true' },
      { storeId: store.id, key: 'pickup_enabled', value: 'true' },
      { storeId: store.id, key: 'min_order_delivery', value: '500' },
      { storeId: store.id, key: 'loyalty_points_rate', value: '1' }, // 1 point per 100 PKR
      { storeId: store.id, key: 'whatsapp_notifications', value: 'true' },
      { storeId: store.id, key: 'sms_notifications', value: 'true' },
    ],
  });
  console.log('✅ Store settings created');

  console.log('\n🎉 Seeding complete! Mega Mart is ready to go.');
  console.log('\n📋 Demo Accounts:');
  console.log('   Super Admin:  admin@megamart.pk / admin123');
  console.log('   Manager:      manager@megamart.pk / manager123');
  console.log('   Cashier:      cashier@megamart.pk / cashier123');
  console.log('   Rider:        rider@megamart.pk / rider123');
  console.log('   Warehouse:    warehouse@megamart.pk / warehouse123');
  console.log('   Customer:     customer@test.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
