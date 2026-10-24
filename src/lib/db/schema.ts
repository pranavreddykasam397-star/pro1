import { pgTable, serial, integer, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * 1. Better Auth Core Schemas (Admin & Owner Authentication)
 * ============================================================================
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('admin'), // 'admin' | 'staff'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'), // Hashed password
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(), // e.g. Phone number or email
  value: text('value').notNull(), // OTP code
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * ============================================================================
 * 2. Restaurant Domain Schemas (Preserving 1:1 Legacy Entity Parity)
 * ============================================================================
 */

/**
 * Menu Items Table (Formerly Mongoose Menu collection)
 * Stores the full restaurant catalog and daily specials
 */
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull().default('veg'), // 'veg' | 'non-veg'
  imageUrl: text('image_url'),
  isSpecial: boolean('is_special').notNull().default(false),
  timeHash: text('time_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Customers Table (Formerly Mongoose Customer collection)
 * Frictionless customer identification using numeric Customer ID + 4-digit PIN
 */
export const customers = pgTable('customers', {
  id: integer('id').primaryKey(), // Custom readable Customer ID
  pin: text('pin').notNull(), // 4-digit PIN (Hashed or plaintext per admin lookup requirements)
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Orders Table (Formerly Mongoose Order collection)
 * Stores customer orders, payment status, discount deductions, and items
 */
export type OrderItemSnapshot = {
  menu_name: string;
  quantity: number;
  price_at_time: number;
};

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  total: integer('total').notNull(),
  discountApplied: integer('discount_applied').notNull().default(0),
  method: text('method').notNull().default('QR'), // 'QR' | 'CASH'
  customerId: integer('customer_id').references(() => customers.id),
  phone: text('phone'),
  paymentStatus: text('payment_status').notNull().default('PENDING'), // 'PENDING' | 'CONFIRMED' | 'REJECTED'
  paymentScreenshot: text('payment_screenshot'),
  items: jsonb('items').$type<OrderItemSnapshot[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Owners Table (Legacy reference retained for direct owner lookups)
 */
export const owners = pgTable('owners', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Daily Summaries Table (Formerly Mongoose DailySummary collection)
 * Day-end revenue rollups and archived order histories
 */
export const dailySummaries = pgTable('daily_summaries', {
  id: serial('id').primaryKey(),
  date: text('date').notNull().unique(), // Format: YYYY-MM-DD
  totalRevenue: integer('total_revenue').notNull().default(0),
  orderCount: integer('order_count').notNull().default(0),
  ordersJson: jsonb('orders_json').$type<any[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Settings Table (Formerly Mongoose Setting collection)
 * Stores dynamic restaurant configuration such as UPI ID and QR code asset URL
 */
export type RestaurantConfig = {
  upiId?: string;
  ownerQr?: string;
};

export const settings = pgTable('settings', {
  key: text('key').primaryKey(), // Default: 'config'
  value: jsonb('value').$type<RestaurantConfig>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
