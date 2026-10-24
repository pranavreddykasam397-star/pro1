import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from './context';
import { ZodError } from 'zod';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces the caller is an authenticated Admin/Owner
 */
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Access denied: Admin credentials or session required.',
    });
  }
  return next({
    ctx: {
      ...ctx,
      isAdmin: true,
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
