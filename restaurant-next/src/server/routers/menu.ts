import { router, publicProcedure, adminProcedure } from '../trpc';
import { menuItems } from '@/lib/db/schema';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  deleteMenuItemSchema,
  toggleSpecialSchema,
} from '@/lib/validators';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export const menuRouter = router({
  /**
   * Public Query: Fetch complete menu, active daily special, and unique categories
   * Replaces GET /api/data
   */
  getMenu: publicProcedure.query(async ({ ctx }) => {
    try {
      const allItems = await ctx.db
        .select()
        .from(menuItems)
        .orderBy(desc(menuItems.id));

      if (allItems && allItems.length > 0) {
        const dailySpecial = allItems.find((item) => item.isSpecial) || null;
        const categories = [
          ...new Set(allItems.map((item) => item.category).filter(Boolean)),
        ];

        return {
          menu: allItems,
          dailySpecial,
          categories,
        };
      }
    } catch (err) {
      console.warn('[menu.getMenu] DB query failed, using static menu fallback:', err);
    }

    // Graceful fallback from menuData.json so the UI never displays broken skeleton cards
    try {
      const fs = await import('fs');
      const path = await import('path');
      const jsonPath = path.join(process.cwd(), 'src', 'lib', 'db', 'menuData.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const items = JSON.parse(raw);
        const mapped = items.map((m: any, idx: number) => ({
          id: m.id || idx + 1,
          name: m.name,
          price: Number(m.price) || 0,
          category: m.category || 'CURRIES',
          type: (m.type || 'veg').toLowerCase(),
          imageUrl: m.imageUrl || null,
          isSpecial: Boolean(m.isSpecial),
          timeHash: String(m.timeHash || Date.now()),
          createdAt: new Date(),
        }));
        const dailySpecial = mapped.find((item: any) => item.isSpecial) || null;
        const categories = [
          ...new Set(mapped.map((item: any) => item.category).filter(Boolean)),
        ];
        return {
          menu: mapped,
          dailySpecial,
          categories,
        };
      }
    } catch (fallbackErr) {
      console.error('[menu.getMenu] Fallback also failed:', fallbackErr);
    }

    return {
      menu: [],
      dailySpecial: null,
      categories: [],
    };
  }),

  /**
   * Admin Mutation: Create a new dish
   * Replaces POST /api/admin/menu
   */
  createItem: adminProcedure
    .input(createMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      // If marking as special, unmark any existing special
      if (input.isSpecial) {
        await ctx.db
          .update(menuItems)
          .set({ isSpecial: false })
          .where(eq(menuItems.isSpecial, true));
      }

      const [newItem] = await ctx.db
        .insert(menuItems)
        .values({
          name: input.name,
          price: input.price,
          category: input.category,
          type: input.type,
          imageUrl: input.imageUrl || null,
          isSpecial: input.isSpecial,
          timeHash: String(Date.now()),
        })
        .returning();

      return newItem;
    }),

  /**
   * Admin Mutation: Update an existing dish
   */
  updateItem: adminProcedure
    .input(updateMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...dataToUpdate } = input;

      if (dataToUpdate.isSpecial) {
        await ctx.db
          .update(menuItems)
          .set({ isSpecial: false })
          .where(eq(menuItems.isSpecial, true));
      }

      const [updatedItem] = await ctx.db
        .update(menuItems)
        .set(dataToUpdate)
        .where(eq(menuItems.id, id))
        .returning();

      return updatedItem;
    }),

  /**
   * Admin Mutation: Delete a dish from the menu
   */
  deleteItem: adminProcedure
    .input(deleteMenuItemSchema)
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(menuItems)
        .where(eq(menuItems.id, input.id))
        .returning();

      return { success: true, deletedId: deleted?.id };
    }),

  /**
   * Admin Mutation: Toggle a dish as Daily Special
   */
  toggleSpecial: adminProcedure
    .input(toggleSpecialSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.isSpecial) {
        // Unmark all others
        await ctx.db
          .update(menuItems)
          .set({ isSpecial: false })
          .where(eq(menuItems.isSpecial, true));
      }

      const [updated] = await ctx.db
        .update(menuItems)
        .set({ isSpecial: input.isSpecial })
        .where(eq(menuItems.id, input.id))
        .returning();

      return updated;
    }),

  /**
   * Admin Query: Search relevant food photos for menu creation
   * Replaces GET /api/images/search
   */
  searchImages: adminProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const cleanQuery = encodeURIComponent(input.query.trim());

      try {
        // Use Unsplash source for high-quality food photography
        const res = await fetch(
          `https://api.unsplash.com/search/photos?page=1&per_page=6&query=${cleanQuery}+food&client_id=sP-m3f9g-1x2w4y6z8`,
          { headers: { 'Accept-Version': 'v1' } }
        );

        if (res.ok) {
          const data = await res.json();
          const urls = data.results?.map((r: any) => r.urls?.regular).filter(Boolean);
          if (urls && urls.length > 0) return urls;
        }
      } catch {
        // Fallback gracefully below
      }

      // Curated reliable fallback Indian food photography
      return [
        `https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80`,
        `https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80`,
        `https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80`,
        `https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80`,
      ];
    }),
});
