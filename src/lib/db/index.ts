import * as schema from './schema';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://heritage_user:IAF16WoGaEeEUE8KXTDNxBmJflrZbRzS@dpg-dbe73fnavr4c739t2in0-a.oregon-postgres.render.com/heritage_db_46bw?sslmode=require';
const isRemotePostgres = Boolean(
  connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1')
);

export type DatabaseInstance = ReturnType<typeof drizzlePglite<typeof schema>>;

// Helper: Safely remove stale PostgreSQL lockfile (postmaster.pid)
function removeStaleLock(dir: string) {
  try {
    const pidFile = path.join(dir, 'postmaster.pid');
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
      console.log('[DB] Removed stale postmaster.pid lockfile in:', dir);
    }
  } catch {
    // Ignore if file doesn't exist or already removed
  }
}

// Global caching to prevent multiple client instances during Next.js HMR
const globalForDb = globalThis as unknown as {
  db: DatabaseInstance | undefined;
  pgliteClient: PGlite | undefined;
  initialized: boolean | undefined;
};

let db: DatabaseInstance;

if (globalForDb.db) {
  db = globalForDb.db;
} else if (isRemotePostgres && connectionString) {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  db = drizzleNodePg(pool, { schema }) as unknown as DatabaseInstance;
  globalForDb.db = db;
} else {
  // Embedded WebAssembly PostgreSQL (PGlite) - Zero setup, works out of the box with file persistence
  const dataDir = path.join(process.cwd(), '.pgdata');
  removeStaleLock(dataDir);

  let client: PGlite;
  if (globalForDb.pgliteClient) {
    client = globalForDb.pgliteClient;
  } else {
    try {
      client = new PGlite(dataDir);
    } catch (err) {
      console.warn('[DB] Failed to open .pgdata directory, retrying after lock cleanup:', err);
      removeStaleLock(dataDir);
      try {
        client = new PGlite(dataDir);
      } catch (fallbackErr) {
        console.error('[DB] Persistent .pgdata unavailable, using in-memory database:', fallbackErr);
        client = new PGlite();
      }
    }
    globalForDb.pgliteClient = client;

    // Register process cleanup hooks so postmaster.pid is removed on exit
    if (typeof process !== 'undefined') {
      const cleanup = () => removeStaleLock(dataDir);
      process.once('SIGINT', cleanup);
      process.once('SIGTERM', cleanup);
      process.once('exit', cleanup);
    }
  }

  db = drizzlePglite(client, { schema });
  globalForDb.db = db;

  // Auto-initialize schema and initial dishes if needed
  if (!globalForDb.initialized) {
    globalForDb.initialized = true;
    (async () => {
      try {
        await client.waitReady;
        const check = await client.query("SELECT to_regclass('public.menu_items') as tbl;");
        const exists = (check.rows[0] as any)?.tbl;
        if (!exists) {
          const sqlPath = path.join(process.cwd(), 'drizzle', '0000_superb_lenny_balinger.sql');
          if (fs.existsSync(sqlPath)) {
            const sql = fs.readFileSync(sqlPath, 'utf-8');
            const stmts = sql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
            for (const s of stmts) {
              try { await client.exec(s); } catch {}
            }
          }
        }

        const countCheck = await db.select().from(schema.menuItems).limit(1);
        if (countCheck.length === 0) {
          const jsonPath = path.join(process.cwd(), 'src', 'lib', 'db', 'menuData.json');
          if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, 'utf-8');
            const items = JSON.parse(raw);
            const formatted = items.map((m: any) => ({
              name: m.name,
              price: Number(m.price) || 0,
              category: m.category || 'CURRIES',
              type: (m.type || 'veg').toLowerCase(),
              imageUrl: m.imageUrl || null,
              isSpecial: Boolean(m.isSpecial),
              timeHash: String(m.timeHash || Date.now()),
            }));
            await db.insert(schema.menuItems).values(formatted);
          }

          await client.query(`
            INSERT INTO settings (key, value)
            VALUES ('config', '{"upiId": "9392767835@ybl", "ownerQr": ""}'::jsonb)
            ON CONFLICT (key) DO NOTHING
          `);
        }
      } catch (e) {
        console.warn('[DB] PGlite auto-init notice:', e);
      }
    })();
  }
}

export { db, schema };
