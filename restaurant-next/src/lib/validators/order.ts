import { z } from 'zod';

export const orderItemSchema = z.object({
  menu_name: z.string().min(1, 'Dish name required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  price_at_time: z.number().int().nonnegative('Price cannot be negative'),
});

export const paymentStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'REJECTED']);
export const paymentMethodSchema = z.enum(['QR', 'CASH']);

export const createOrderSchema = z.object({
  total: z.number().int().positive('Order total must be greater than 0'),
  discountApplied: z.number().int().nonnegative().default(0),
  method: paymentMethodSchema.default('QR'),
  customerId: z.number().int().positive().optional().nullable(),
  phone: z.string().min(7).max(15).optional().nullable(),
  paymentScreenshot: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.number().int().positive('Order ID is required'),
  status: paymentStatusSchema,
});

export const getOrdersByDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
