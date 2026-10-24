import { router, publicProcedure, adminProcedure } from '../trpc';
import { settings, RestaurantConfig } from '@/lib/db/schema';
import { updateSettingsSchema } from '@/lib/validators';
import { eq } from 'drizzle-orm';

export const settingsRouter = router({
  /**
   * Public Query: Fetch active restaurant configuration (UPI ID, owner QR)
   */
  getConfig: publicProcedure.query(async ({ ctx }) => {
    const defaultConfig: RestaurantConfig = {
      upiId: '9392767835@ybl',
      ownerQr: '',
    };

    try {
      const [row] = await ctx.db
        .select()
        .from(settings)
        .where(eq(settings.key, 'config'))
        .limit(1);

      return row ? (row.value as RestaurantConfig) : defaultConfig;
    } catch (err) {
      console.warn('[settings.getConfig] DB query failed, using defaultConfig:', err);
      return defaultConfig;
    }
  }),

  /**
   * Admin Mutation: Update dynamic restaurant configuration
   * Replaces POST /api/admin/settings
   */
  updateConfig: adminProcedure
    .input(updateSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(settings)
        .where(eq(settings.key, 'config'))
        .limit(1);

      const currentVal: RestaurantConfig = existing?.value
        ? (existing.value as RestaurantConfig)
        : {};

      const updatedVal: RestaurantConfig = {
        ...currentVal,
        ...(input.upiId !== undefined ? { upiId: input.upiId } : {}),
        ...(input.ownerQr !== undefined ? { ownerQr: input.ownerQr } : {}),
      };

      const [updated] = await ctx.db
        .insert(settings)
        .values({
          key: 'config',
          value: updatedVal,
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: updatedVal,
            updatedAt: new Date(),
          },
        })
        .returning();

      return updated.value as RestaurantConfig;
    }),
});
