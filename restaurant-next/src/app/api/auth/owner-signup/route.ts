import { NextResponse } from 'next/server';
import { ownerSignupSchema } from '@/lib/validators';
import { verifyAdminOtp } from '@/lib/services/sms';
import { db } from '@/lib/db';
import { owners, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = ownerSignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { email, password, otp } = result.data;

    // Verify SMS OTP
    const isOtpValid = verifyAdminOtp(otp);
    if (!isOtpValid) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db
      .select({ id: owners.id })
      .from(owners)
      .where(eq(owners.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'An owner with this email already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Save to legacy owners table
    await db.insert(owners).values({
      email: cleanEmail,
      passwordHash,
    });

    // Also register in Better Auth user table
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

    return NextResponse.json({ success: true, message: 'Owner registered successfully' });
  } catch (error: any) {
    console.error('Owner signup error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
