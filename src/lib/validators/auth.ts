import { z } from 'zod';

export const sendOtpSchema = z.object({
  phone: z.string().optional().default('9392767835'),
});

export const ownerSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  otp: z.string().length(4, 'OTP must be exactly 4 digits').regex(/^\d{4}$/, 'OTP must be numeric'),
});

export const ownerLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const customerSignupSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must be numeric'),
  phone: z.string().min(7).max(15).optional().nullable(),
});

export const customerLoginSchema = z.object({
  customerId: z.number().int().positive('Valid Customer ID is required'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must be numeric'),
});

export const customerLookupSchema = z.object({
  customerId: z.number().int().positive('Customer ID is required'),
});

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
