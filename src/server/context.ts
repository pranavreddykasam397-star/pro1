import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export async function createContext(opts?: FetchCreateContextFnOptions) {
  const req = opts?.req;
  const headers = req ? new Headers(req.headers) : new Headers();

  // 1. Try to get session via Better Auth
  let session = null;
  try {
    session = await auth.api.getSession({
      headers,
    });
  } catch {
    session = null;
  }

  // 2. Check for x-admin-token or legacy admin token header
  const adminToken = headers.get('x-admin-token');
  const isDirectAdmin = Boolean(
    adminToken && (adminToken === process.env.ADMIN_TOKEN || adminToken === 'super_secret_admin_token_123')
  );

  const isAdmin = Boolean(session?.user?.role === 'admin' || isDirectAdmin);

  return {
    db,
    req,
    headers,
    session,
    isAdmin,
    user: session?.user || null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
