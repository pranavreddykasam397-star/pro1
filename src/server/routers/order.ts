import { router, publicProcedure, adminProcedure } from '../trpc';
import { orders, dailySummaries, customers, menuItems } from '@/lib/db/schema';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '@/lib/validators';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { verifyCustomerSession } from '@/lib/auth/customer';

export const orderRouter = router({
  /**
   * Public Mutation: Submit a new order
   * Replaces POST /api/orders
   */
  createOrder: publicProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate customer ID if provided
      if (input.customerId) {
        const [cust] = await ctx.db
          .select({ id: customers.id })
          .from(customers)
          .where(eq(customers.id, input.customerId))
          .limit(1);

        if (!cust) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Provided Customer ID does not exist.',
          });
        }
      }

      const [newOrder] = await ctx.db
        .insert(orders)
        .values({
          total: input.total,
          discountApplied: input.discountApplied,
          method: input.method,
          customerId: input.customerId || null,
          phone: input.phone || null,
          paymentStatus: 'PENDING',
          paymentScreenshot: input.paymentScreenshot || null,
          items: input.items,
        })
        .returning();

      return newOrder;
    }),

  /**
   * Admin Query: Fetch all live orders for the dashboard
   * Replaces GET /api/admin/data orders
   */
  getAllOrders: adminProcedure.query(async ({ ctx }) => {
    const orderList = await ctx.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    const totalRevenue = orderList
      .filter((o) => o.paymentStatus === 'CONFIRMED')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingCount = orderList.filter((o) => o.paymentStatus === 'PENDING').length;

    return {
      orders: orderList,
      totalRevenue,
      pendingCount,
      totalOrders: orderList.length,
    };
  }),

  /**
   * Admin Mutation: Update payment verification status
   * Replaces PATCH /api/admin/orders/:id
   */
  updateStatus: adminProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(orders)
        .set({ paymentStatus: input.status })
        .where(eq(orders.id, input.orderId))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found.',
        });
      }

      return updated;
    }),

  /**
   * Public Query: Fetch order history for a customer using PIN or token
   * Replaces customer history checks
   */
  getCustomerOrders: publicProcedure
    .input(
      z.object({
        customerId: z.number().int().positive(),
        pin: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify via token or PIN
      let isVerified = false;

      if (input.token) {
        const verifiedId = verifyCustomerSession(input.token);
        if (verifiedId === input.customerId) {
          isVerified = true;
        }
      }

      if (!isVerified && input.pin) {
        const [cust] = await ctx.db
          .select()
          .from(customers)
          .where(eq(customers.id, input.customerId))
          .limit(1);

        if (cust && cust.pin === input.pin.trim()) {
          isVerified = true;
        }
      }

      if (!isVerified) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid Customer ID, PIN, or session token.',
        });
      }

      const customerOrders = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.customerId, input.customerId))
        .orderBy(desc(orders.createdAt));

      return customerOrders;
    }),

  /**
   * Admin Query: Fetch daily revenue summaries
   * Replaces GET /api/admin/data summaries
   */
  getDailySummaries: adminProcedure.query(async ({ ctx }) => {
    const summaries = await ctx.db
      .select()
      .from(dailySummaries)
      .orderBy(desc(dailySummaries.date));

    return summaries;
  }),

  /**
   * Admin Mutation: End the business day
   * Aggregates active orders, saves to daily_summaries, and clears current live order stream
   */
  endDay: adminProcedure.mutation(async ({ ctx }) => {
    const orderList = await ctx.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    if (orderList.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No active orders to summarize for the day.',
      });
    }

    const confirmedOrders = orderList.filter((o) => o.paymentStatus === 'CONFIRMED');
    const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

    // Format IST date string (YYYY-MM-DD)
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    // Check if a summary for today already exists to merge
    const [existingSummary] = await ctx.db
      .select()
      .from(dailySummaries)
      .where(eq(dailySummaries.date, dateStr))
      .limit(1);

    let finalRevenue = confirmedRevenue;
    let finalOrderCount = orderList.length;
    let finalOrdersJson = orderList;

    if (existingSummary) {
      finalRevenue = existingSummary.totalRevenue + confirmedRevenue;
      finalOrderCount = existingSummary.orderCount + orderList.length;
      finalOrdersJson = [...(existingSummary.ordersJson || []), ...orderList];

      await ctx.db
        .update(dailySummaries)
        .set({
          totalRevenue: finalRevenue,
          orderCount: finalOrderCount,
          ordersJson: finalOrdersJson,
          createdAt: new Date(),
        })
        .where(eq(dailySummaries.date, dateStr));
    } else {
      await ctx.db.insert(dailySummaries).values({
        date: dateStr,
        totalRevenue: finalRevenue,
        orderCount: finalOrderCount,
        ordersJson: finalOrdersJson,
      });
    }

    // Reset daily special if any
    try {
      await ctx.db
        .update(menuItems)
        .set({ isSpecial: false })
        .where(eq(menuItems.isSpecial, true));
    } catch (e) {
      console.warn('[order.endDay] Could not reset daily special:', e);
    }

    // Clear active orders so the new day starts fresh
    await ctx.db.delete(orders);

    return {
      success: true,
      summary: {
        date: dateStr,
        totalRevenue: finalRevenue,
        orderCount: finalOrderCount,
        confirmedRevenue,
        ordersArchived: orderList.length,
      },
    };
  }),
});
