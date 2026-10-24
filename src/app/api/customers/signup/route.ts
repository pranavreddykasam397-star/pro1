import { NextResponse } from 'next/server';
import { registerCustomer } from '@/lib/auth/customer';
import { customerSignupSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = customerSignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { pin, phone } = parsed.data;
    const result = await registerCustomer(pin, phone || undefined);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      customer: result.customer,
      token: result.token,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
