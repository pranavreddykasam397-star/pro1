import { NextResponse } from 'next/server';
import { authenticateCustomer } from '@/lib/auth/customer';
import { customerLoginSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = customerLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const { customerId, pin } = parsed.data;
    const result = await authenticateCustomer(customerId, pin);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
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
