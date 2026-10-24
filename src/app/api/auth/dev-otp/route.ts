import { NextResponse } from 'next/server';
import { getDevOtp } from '@/lib/services/sms';

export async function GET() {
  const otp = getDevOtp();
  return NextResponse.json({ otp: otp || null });
}
