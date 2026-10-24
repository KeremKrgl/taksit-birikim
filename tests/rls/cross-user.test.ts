// Proves that one user can never read or change another user's data.
// Runs against Postgres with the Supabase stub + all migrations applied:
//   eval "$(scripts/test-db.sh)" && pnpm test:rls
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const DATABASE_URL = process.env.DATABASE_URL;

// Every table in `public` must be listed here; the coverage test fails otherwise,
// so a new table can't ship without being checked.
const USER_TABLES = [
  "cards",
  "statement_imports",
  "purchases",
  "installments",
  "savings_assets",
  "notifications",
  "push_subscriptions",
  "consent_events",
] as const;
const SPECIAL_TABLES = ["profiles", "referrals"] as const;
const REFERENCE_TABLES = ["fx_gold_daily", "cpi_monthly", "gold_units", "holidays"] as const;

type Ids = { user: string; card: string; purchase: string; importId: string };

describe.skipIf(!DATABASE_URL)("row level security", () => {
  const db = new Client({ connectionString: DATABASE_URL });
  let a: Ids;
  let b: Ids;

  async function seedUser(label: string): Promise<Ids> {
    const user = randomUUID();
    await db.query("insert into auth.users (id, email) values ($1, $2)", [user, `${label}-${user}@test.local`]);
    const card = (
      await db.query(
        `insert into public.cards (user_id, bank_name, nickname, last4, statement_day, due_day)
         values ($1, 'Garanti BBVA', 'Bonus', '1234', 25, 5) returning id`,
        [user],
      )
    ).rows[0].id as string;
    const importId = (
      await db.query("insert into public.statement_imports (user_id, status) values ($1, 'review') returning id", [user])
    ).rows[0].id as string;
    const purchase = (
      await db.query(
        `insert into public.purchases (user_id, card_id, merchant, purchase_date, total_kurus, installment_count, import_id)
         values ($1, $2, 'Teknosa', '2026-10-01', 1200000, 6, $3) returning id`,
        [user, card, importId],
      )
    ).rows[0].id as string;
    await db.query(
      `insert into public.installments (user_id, purchase_id, card_id, installment_no, amount_kurus, statement_date, due_date)
       values ($1, $2, $3, 1, 200000, '2026-10-25', '2026-11-05')`,
      [user, purchase, card],
    );
    await db.query(
      `insert into public.savings_assets (user_id, type, quantity, gold_unit, cost_basis_kurus, acquired_at)
       values ($1, 'gold_gram', 2, 'ceyrek', 2000000, '2026-01-15')`,
      [user],
    );
    await db.query(
      `insert into public.notifications (user_id, kind, channel, scheduled_for, dedupe_key)
       values ($1, 'due_reminder', 'push', now(), $2)`,
      [user, `due-${user}`],
    );
    await db.query(
      `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
       values ($1, $2, 'k', 'a')`,
      [user, `https://push.example/${user}`],
    );
    await db.query(
      "insert into public.consent_events (user_id, kind, version, granted) values ($1, 'kvkk_notice', '2026-10', true)",
      [user],
    );
    return { user, card, purchase, importId };
  }

  /** Runs `fn` as a signed-in user (or anon when uid is null) inside a rolled-back transaction. */
  async function as<T>(uid: string | null, fn: () => Promise<T>): Promise<T> {
    await db.query("begin");
    try {
      await db.query(`set local role ${uid ? "authenticated" : "anon"}`);
      await db.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify(uid ? { sub: uid, role: "authenticated" } : { role: "anon" }),
      ]);
      return await fn();
    } finally {
      await db.query("rollback");
    }
  }

  /** Like `as`, but returns the Postgres error message (or null if the statement worked). */
  async function errorAs(uid: string | null, sql: string, params: unknown[] = []): Promise<string | null> {
    return as(uid, async () => {
      try {
        await db.query(sql, params);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    });
  }

  beforeAll(async () => {
    await db.connect();
    a = await seedUser("a");
    b = await seedUser("b");
  });

  afterAll(async () => {
    await db.end();
  });

  it("has RLS enabled on every table in public, and every table is covered here", async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      `select c.relname, c.relrowsecurity from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' order by 1`,
    );
    expect(rows.filter((r) => !r.relrowsecurity).map((r) => r.relname)).toEqual([]);
    const covered = new Set<string>([...USER_TABLES, ...SPECIAL_TABLES, ...REFERENCE_TABLES]);
    expect(rows.map((r) => r.relname).filter((t) => !covered.has(t))).toEqual([]);
  });

  describe.each(USER_TABLES)("%s", (table) => {
    it("user B sees only their own rows", async () => {
      const rows = await as(b.user, async () => (await db.query(`select user_id from public.${table}`)).rows);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.user_id === b.user)).toBe(true);
    });

    it("user B cannot update or delete user A's rows", async () => {
      await as(b.user, async () => {
        // Some tables don't grant UPDATE/DELETE at all; a permission error is also a pass.
        for (const sql of [
          `update public.${table} set user_id = user_id where user_id = $1`,
          `delete from public.${table} where user_id = $1`,
        ]) {
          await db.query("savepoint s");
          try {
            const res = await db.query(sql, [a.user]);
            expect(res.rowCount).toBe(0);
          } catch (e) {
            expect((e as Error).message).toMatch(/permission denied/);
          }
          await db.query("rollback to savepoint s");
        }
      });
      const left = await db.query(`select count(*)::int as n from public.${table} where user_id = $1`, [a.user]);
      expect(left.rows[0].n).toBeGreaterThan(0);
    });

    it("signed-out visitors see nothing", async () => {
      const err = await errorAs(null, `select * from public.${table}`);
      expect(err).toMatch(/permission denied/);
    });
  });

  it("user B cannot create rows owned by user A", async () => {
    const attempts: [string, unknown[]][] = [
      [
        `insert into public.cards (user_id, bank_name, nickname, last4, statement_day, due_day)
         values ($1, 'Akbank', 'Axess', '9999', 1, 11)`,
        [a.user],
      ],
      ["insert into public.statement_imports (user_id) values ($1)", [a.user]],
      [
        `insert into public.savings_assets (user_id, type, quantity, cost_basis_kurus, acquired_at)
         values ($1, 'usd', 100, 400000, '2026-01-01')`,
        [a.user],
      ],
      ["insert into public.consent_events (user_id, kind, version, granted) values ($1, 'marketing', 'x', true)", [a.user]],
      ["insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://x', 'k', 'a')", [a.user]],
    ];
    for (const [sql, params] of attempts) {
      expect(await errorAs(b.user, sql, params)).toMatch(/row-level security|permission denied/);
    }
  });

  it("user B cannot attach their rows to user A's card, purchase or import", async () => {
    const onACard = await errorAs(
      b.user,
      `insert into public.purchases (user_id, card_id, merchant, purchase_date, total_kurus, installment_count)
       values ($1, $2, 'X', '2026-10-01', 100, 1)`,
      [b.user, a.card],
    );
    expect(onACard).toMatch(/foreign key/);

    const onAPurchase = await errorAs(
      b.user,
      `insert into public.installments (user_id, purchase_id, card_id, installment_no, amount_kurus, statement_date, due_date)
       values ($1, $2, $3, 2, 100, '2026-11-25', '2026-12-05')`,
      [b.user, a.purchase, b.card],
    );
    expect(onAPurchase).toMatch(/foreign key/);

    const onAImport = await errorAs(
      b.user,
      `insert into public.purchases (user_id, card_id, merchant, purchase_date, total_kurus, installment_count, import_id)
       values ($1, $2, 'X', '2026-10-01', 100, 1, $3)`,
      [b.user, b.card, a.importId],
    );
    expect(onAImport).toMatch(/foreign key/);
  });

  describe("profiles", () => {
    it("each user sees only their own profile", async () => {
      const rows = await as(b.user, async () => (await db.query("select id from public.profiles")).rows);
      expect(rows).toEqual([{ id: b.user }]);
    });

    it("a user can change their name and locale but not someone else's", async () => {
      const own = await as(a.user, async () =>
        db.query("update public.profiles set display_name = 'Ayşe', locale = 'en' where id = $1", [a.user]),
      );
      expect(own.rowCount).toBe(1);
      const other = await as(b.user, async () =>
        db.query("update public.profiles set display_name = 'x' where id = $1", [a.user]),
      );
      expect(other.rowCount).toBe(0);
    });

    it("a user cannot give themselves premium or fake a consent", async () => {
      for (const set of ["plan = 'premium'", "premium_until = now()", "kvkk_notice_version = 'x'", "analytics_consent = true"]) {
        expect(await errorAs(a.user, `update public.profiles set ${set} where id = $1`, [a.user])).toMatch(
          /permission denied/,
        );
      }
    });

    it("a user cannot create or delete profiles", async () => {
      expect(await errorAs(a.user, "delete from public.profiles where id = $1", [a.user])).toMatch(/permission denied/);
      expect(await errorAs(a.user, "insert into public.profiles (id) values ($1)", [randomUUID()])).toMatch(
        /permission denied/,
      );
    });
  });

  describe("consent_events", () => {
    it("is append-only for users and updates the profile", async () => {
      expect(await errorAs(a.user, "delete from public.consent_events where user_id = $1", [a.user])).toMatch(
        /permission denied/,
      );
      expect(await errorAs(a.user, "update public.consent_events set granted = false where user_id = $1", [a.user])).toMatch(
        /permission denied/,
      );
      const after = await as(a.user, async () => {
        await db.query(
          "insert into public.consent_events (user_id, kind, version, granted) values ($1, 'analytics', '2026-10', true)",
          [a.user],
        );
        return (await db.query("select analytics_consent, kvkk_notice_version from public.profiles")).rows[0];
      });
      expect(after).toEqual({ analytics_consent: true, kvkk_notice_version: "2026-10" });
    });
  });

  describe("referrals", () => {
    it("are visible to both sides only and cannot be written by users", async () => {
      const c = randomUUID();
      await db.query("insert into auth.users (id, email) values ($1, $2)", [c, `c-${c}@test.local`]);
      await db.query("insert into public.referrals (referrer_id, referee_id) values ($1, $2)", [a.user, c]);
      expect(await as(c, async () => (await db.query("select * from public.referrals")).rowCount)).toBe(1);
      expect(await as(b.user, async () => (await db.query("select * from public.referrals")).rowCount)).toBe(0);
      expect(
        await errorAs(b.user, "insert into public.referrals (referrer_id, referee_id) values ($1, $2)", [b.user, a.user]),
      ).toMatch(/permission denied/);
      expect(await errorAs(c, "update public.referrals set granted_at = now()")).toMatch(/permission denied/);
    });
  });

  describe.each(REFERENCE_TABLES)("reference table %s", (table) => {
    it("is readable by signed-in users and not writable", async () => {
      await as(a.user, async () => db.query(`select * from public.${table} limit 1`));
      expect(await errorAs(a.user, `delete from public.${table}`)).toMatch(/permission denied/);
      expect(await errorAs(null, `select * from public.${table}`)).toMatch(/permission denied/);
    });
  });

  it("rejects anything that looks like a full card number", async () => {
    const err = await errorAs(
      a.user,
      `insert into public.cards (user_id, bank_name, nickname, last4, statement_day, due_day)
       values ($1, 'Akbank', '5528790012345678', '5678', 1, 11)`,
      [a.user],
    );
    expect(err).toMatch(/check constraint/);
    const bad4 = await errorAs(
      a.user,
      `insert into public.cards (user_id, bank_name, nickname, last4, statement_day, due_day)
       values ($1, 'Akbank', 'Axess', '12345', 1, 11)`,
      [a.user],
    );
    expect(bad4).toMatch(/check constraint/);
  });

  it("deleting the account removes every row the user owns", async () => {
    const d = await seedUser("d");
    await db.query("delete from auth.users where id = $1", [d.user]);
    for (const table of USER_TABLES) {
      const { rows } = await db.query(`select count(*)::int as n from public.${table} where user_id = $1`, [d.user]);
      expect(rows[0].n, table).toBe(0);
    }
    const p = await db.query("select count(*)::int as n from public.profiles where id = $1", [d.user]);
    expect(p.rows[0].n).toBe(0);
  });
});
