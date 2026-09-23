import { Database } from "bun:sqlite";

/** Open a splitbill database and make sure the schema exists. Pass ":memory:" in tests. */
export function openDb(path = "splitbill.sqlite"): Database {
  const db = new Database(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  initSchema(db);
  return db;
}

export function initSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id),
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member'
    );
    CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES groups(id),
      payer_id TEXT NOT NULL REFERENCES members(id),
      amount_cents INTEGER NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_expenses_group_created ON expenses(group_id, created_at);

    CREATE TABLE IF NOT EXISTS expense_shares (
      expense_id TEXT NOT NULL REFERENCES expenses(id),
      member_id TEXT NOT NULL REFERENCES members(id),
      share_cents INTEGER NOT NULL,
      PRIMARY KEY (expense_id, member_id)
    );
    CREATE INDEX IF NOT EXISTS idx_shares_member ON expense_shares(member_id);
  `);
}

export function isSeeded(db: Database): boolean {
  const row = db.query("SELECT COUNT(*) as n FROM groups").get() as { n: number };
  return row.n > 0;
}
