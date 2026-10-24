import { db } from '../db';
import { customers } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const SESSION_SECRET = process.env.BETTER_AUTH_SECRET || 'heritage_customer_secret_key_123';

export interface CustomerAuthResult {
  success: boolean;
  customer?: {
    id: number;
    pin: string;
    phone?: string | null;
  };
  token?: string;
  error?: string;
}

/**
 * Generate a unique readable 5-digit Customer ID
 */
async function generateUniqueCustomerId(): Promise<number> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidateId = Math.floor(10000 + Math.random() * 90000);
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, candidateId))
      .limit(1);

    if (existing.length === 0) {
      return candidateId;
    }
  }
  return Date.now() % 100000;
}

/**
 * Register a new customer with a 4-digit PIN and optional phone number
 */
export async function registerCustomer(pin: string, phone?: string): Promise<CustomerAuthResult> {
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return { success: false, error: 'PIN must be exactly 4 numeric digits.' };
  }

  const customerId = await generateUniqueCustomerId();

  const [newCustomer] = await db
    .insert(customers)
    .values({
      id: customerId,
      pin: cleanPin,
      phone: phone?.trim() || null,
    })
    .returning();

  const token = signCustomerSession(newCustomer.id);

  return {
    success: true,
    customer: {
      id: newCustomer.id,
      pin: newCustomer.pin,
      phone: newCustomer.phone,
    },
    token,
  };
}

/**
 * Verify a customer's ID and 4-digit PIN
 */
export async function authenticateCustomer(id: number, pin: string): Promise<CustomerAuthResult> {
  const cleanPin = pin.trim();

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    return { success: false, error: 'Customer ID not found.' };
  }

  if (customer.pin !== cleanPin) {
    return { success: false, error: 'Incorrect 4-digit PIN.' };
  }

  const token = signCustomerSession(customer.id);

  return {
    success: true,
    customer: {
      id: customer.id,
      pin: customer.pin,
      phone: customer.phone,
    },
    token,
  };
}

/**
 * Look up customer details by ID (used for Admin verification and counter support)
 */
export async function getCustomerById(id: number) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  return customer || null;
}

/**
 * Sign a customer session token using HMAC-SHA256
 */
export function signCustomerSession(customerId: number): string {
  const payload = `${customerId}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const encoded = Buffer.from(payload).toString('base64url');
  return `cust_${encoded}.${signature}`;
}

/**
 * Verify a customer session token and return the Customer ID
 */
export function verifyCustomerSession(token: string): number | null {
  if (!token || !token.startsWith('cust_')) return null;

  try {
    const raw = token.slice(5);
    const [encodedPayload, signature] = raw.split('.');
    if (!encodedPayload || !signature) return null;

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    if (signature !== expectedSignature) return null;

    const [idStr, timestampStr] = payload.split(':');
    const timestamp = parseInt(timestampStr, 10);

    // Tokens valid for 30 days
    if (Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) return null;

    const customerId = parseInt(idStr, 10);
    return isNaN(customerId) ? null : customerId;
  } catch {
    return null;
  }
}
