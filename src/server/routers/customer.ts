import { router, publicProcedure, adminProcedure } from '../trpc';
import { customers, orders } from '@/lib/db/schema';
import {
  customerSignupSchema,
  customerLoginSchema,
  customerLookupSchema,
} from '@/lib/validators';
import { registerCustomer, authenticateCustomer } from '@/lib/auth/customer';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const customerRouter = router({
  /**
   * Public Mutation: Register a new Customer with a 4-digit PIN
   * Replaces POST /api/customers/signup
   */
  signup: publicProcedure
    .input(customerSignupSchema)
    .mutation(async ({ input }) => {
      const result = await registerCustomer(input.pin, input.phone || undefined);

      if (!result.success || !result.customer) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error || 'Failed to register customer.',
        });
      }

      return {
        customer: result.customer,
        token: result.token,
      };
    }),

  /**
   * Public Mutation: Authenticate an existing Customer by ID + 4-digit PIN
   * Replaces POST /api/customers/login
   */
  login: publicProcedure
    .input(customerLoginSchema)
    .mutation(async ({ input }) => {
      const result = await authenticateCustomer(input.customerId, input.pin);

      if (!result.success || !result.customer) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: result.error || 'Invalid Customer ID or PIN.',
        });
      }

      return {
        customer: result.customer,
        token: result.token,
      };
    }),

  /**
   * Admin Query: Look up customer PIN and complete historical order log
   * Replaces GET /api/admin/customers/:id/orders
   */
  adminLookup: adminProcedure
    .input(customerLookupSchema)
    .query(async ({ ctx, input }) => {
      const [customer] = await ctx.db
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .limit(1);

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Customer #${input.customerId} not found.`,
        });
      }

      const orderHistory = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.customerId, input.customerId))
        .orderBy(desc(orders.createdAt));

      return {
        customer: {
          id: customer.id,
          pin: customer.pin, // Plaintext pin displayed for counter staff assistance
          phone: customer.phone,
          createdAt: customer.createdAt,
        },
        orders: orderHistory,
      };
    }),
});
