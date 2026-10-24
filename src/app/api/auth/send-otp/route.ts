import { NextResponse } from 'next/server';
import { sendAdminOtp, DEFAULT_ADMIN_PHONE } from '@/lib/services/sms';
import { sendOtpSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = sendOtpSchema.safeParse(body);
    const phone = parsed.success && parsed.data.phone ? parsed.data.phone : DEFAULT_ADMIN_PHONE;

    const result = await sendAdminOtp(phone);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
