/**
 * SMS OTP Service for Owner Registration (Textbelt Integration)
 * Matches 1:1 with legacy backend/server.js SMS OTP flow
 */

interface OtpRecord {
  code: string;
  expiresAt: number;
}

// In-memory store for OTPs (keyed by phone number)
const otpStore = new Map<string, OtpRecord>();

export const DEFAULT_ADMIN_PHONE = process.env.ADMIN_SMS_NUMBER || '9392767835';
const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY || 'textbelt';

export interface SendOtpResult {
  success: boolean;
  message: string;
  devOtp?: string;
  quotaExceeded?: boolean;
}

/**
 * Generate and dispatch a 4-digit OTP via Textbelt SMS to the super-admin number.
 * Logs to console and provides dev fallback if quota is exceeded.
 */
export async function sendAdminOtp(phoneNumber: string = DEFAULT_ADMIN_PHONE): Promise<SendOtpResult> {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  otpStore.set(cleanPhone, { code: otp, expiresAt });

  console.log(`\n======================================================`);
  console.log(`📱 [HERITAGE AUTH] SMS INITIATED`);
  console.log(`To: ${cleanPhone}`);
  console.log(`Message: Your Heritage owner registration OTP is ${otp}`);
  console.log(`======================================================\n`);

  try {
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: `Your Heritage owner registration OTP is: ${otp}`,
        key: TEXTBELT_API_KEY,
      }),
    });

    const data = await response.json();

    if (data && data.success) {
      console.log('✅ SMS successfully sent via Textbelt!');
      return {
        success: true,
        message: 'OTP sent to your number via SMS',
      };
    } else {
      console.warn('⚠️ Textbelt SMS failed (Quota exceeded or invalid key):', data?.error);
      return {
        success: true,
        message: 'OTP logged to server console (SMS service quota reached)',
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        quotaExceeded: true,
      };
    }
  } catch (error: any) {
    console.error('❌ Failed to connect to SMS Gateway:', error.message);
    return {
      success: true,
      message: 'OTP logged to server console (SMS network error)',
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }
}

/**
 * Verify a submitted OTP code for a phone number.
 * Deletes the OTP upon successful verification to prevent replay attacks.
 */
export function verifyAdminOtp(submittedOtp: string, phoneNumber: string = DEFAULT_ADMIN_PHONE): boolean {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const record = otpStore.get(cleanPhone);

  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return false;
  }

  if (record.code.trim() === submittedOtp.trim()) {
    otpStore.delete(cleanPhone);
    return true;
  }

  return false;
}

/**
 * Development helper to retrieve the latest active OTP for local testing
 */
export function getDevOtp(phoneNumber: string = DEFAULT_ADMIN_PHONE): string | null {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const record = otpStore.get(cleanPhone);
  if (!record || Date.now() > record.expiresAt) return null;
  return record.code;
}
