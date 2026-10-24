import { z } from 'zod';

export const menuItemTypeSchema = z.enum(['veg', 'non-veg']);

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  price: z.number().int().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  type: menuItemTypeSchema.default('veg'),
  imageUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional().nullable(),
  isSpecial: z.boolean().default(false),
});

export const updateMenuItemSchema = z.object({
  id: z.number().int().positive('Valid item ID is required'),
  name: z.string().min(1).max(100).optional(),
  price: z.number().int().positive().optional(),
  category: z.string().min(1).optional(),
  type: menuItemTypeSchema.optional(),
  imageUrl: z.string().url().or(z.literal('')).optional().nullable(),
  isSpecial: z.boolean().optional(),
});

export const toggleSpecialSchema = z.object({
  id: z.number().int().positive(),
  isSpecial: z.boolean(),
});

export const deleteMenuItemSchema = z.object({
  id: z.number().int().positive(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type ToggleSpecialInput = z.infer<typeof toggleSpecialSchema>;
