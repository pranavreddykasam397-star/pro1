import { router, publicProcedure } from '../trpc';
import {
  sendOtpSchema,
  ownerSignupSchema,
} from '@/lib/validators';
import { sendAdminOtp, verifyAdminOtp, getDevOtp } from '@/lib/services/sms';
import { db } from '@/lib/db';
import { owners, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  /**
   * Public Mutation: Request SMS OTP to the super-admin number
   */
  sendOtp: publicProcedure
    .input(sendOtpSchema)
    .mutation(async ({ input }) => {
      const result = await sendAdminOtp(input.phone);
      return result;
    }),

  /**
   * Public Query: Development OTP inspection fallback
   */
  getDevOtp: publicProcedure.query(async () => {
    const otp = getDevOtp();
    return { otp };
  }),

  /**
   * Public Mutation: Owner signup with SMS OTP verification
   */
  ownerSignup: publicProcedure
    .input(ownerSignupSchema)
    .mutation(async ({ input }) => {
      const isOtpValid = verifyAdminOtp(input.otp);
      if (!isOtpValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired OTP code.',
        });
      }

      const cleanEmail = input.email.toLowerCase().trim();

      const existing = await db
        .select({ id: owners.id })
        .from(owners)
        .where(eq(owners.email, cleanEmail))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An owner with this email already exists.',
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      await db.insert(owners).values({
        email: cleanEmail,
        passwordHash,
      });

      const userId = crypto.randomUUID();
      await db
        .insert(user)
        .values({
          id: userId,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          emailVerified: true,
          role: 'admin',
        })
        .onConflictDoNothing();

      return {
        success: true,
        message: 'Owner registered successfully. You can now log in.',
      };
    }),

  /**
   * Public Query: Get current authenticated session info
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
      isAdmin: ctx.isAdmin,
    };
  }),
});
