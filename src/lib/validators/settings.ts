import { z } from 'zod';

export const updateSettingsSchema = z.object({
  upiId: z.string().min(3, 'Valid UPI ID is required').optional(),
  ownerQr: z.string().optional(),
});

export const imageSearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ImageSearchQueryInput = z.infer<typeof imageSearchQuerySchema>;
