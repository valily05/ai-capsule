const path = require("path");

const databaseUrl = (process.env.DATABASE_URL || "").trim();
const isVercel =
  process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.VERCEL_URL);
const isProduction = isVercel || process.env.NODE_ENV === "production";
let pool;
let initializeDatabase;

if (isProduction && !databaseUrl) {
  throw new Error(
    "DATABASE_URL is required in production. Add the Neon PostgreSQL pooled connection string to the Vercel API project's environment variables. Leave it blank only for local SQLite development."
  );
}

if (databaseUrl) {
  if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error(
      "DATABASE_URL must be a full PostgreSQL connection URL, or be left blank to use local SQLite."
    );
  }

  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  if (isVercel) {
    const { attachDatabasePool } = require("@vercel/functions");
    attachDatabasePool(pool);
  }

  initializeDatabase = async () => {
    const connection = await pool.connect();

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS capsules (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          project_name TEXT NOT NULL,
          prompt_title TEXT NOT NULL,
          prompt_version TEXT,
          prompt_text TEXT NOT NULL,
          response_summary TEXT,
          category TEXT,
          usefulness TEXT,
          reviewed BOOLEAN DEFAULT FALSE,
          improved BOOLEAN DEFAULT FALSE,
          screenshot_url TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("PostgreSQL database initialized successfully.");
    } finally {
      connection.release();
    }
  };
} else {
  const Database = require("better-sqlite3");
  const databasePath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, "capsules.sqlite");
  const database = new Database(databasePath);

  database.pragma("journal_mode = WAL");

  function normalizeRows(rows) {
    return rows.map((row) => {
      const normalized = { ...row };
      if (Object.prototype.hasOwnProperty.call(row, "reviewed")) {
        normalized.reviewed = Boolean(row.reviewed);
      }
      if (Object.prototype.hasOwnProperty.call(row, "improved")) {
        normalized.improved = Boolean(row.improved);
      }
      return normalized;
    });
  }

  pool = {
    async query(sql, values = []) {
      const sqliteSql = sql.replace(/\$(\d+)/g, "?$1");
      const statement = database.prepare(sqliteSql);
      const parameters = values.map((value) =>
        typeof value === "boolean" ? Number(value) : value
      );
      const returnsRows = /^\s*SELECT\b/i.test(sql) || /\bRETURNING\b/i.test(sql);

      if (returnsRows) {
        const rows = normalizeRows(statement.all(...parameters));
        return { rows, rowCount: rows.length };
      }

      const result = statement.run(...parameters);
      return { rows: [], rowCount: result.changes };
    },
  };

  initializeDatabase = async () => {
    database.exec(`
      CREATE TABLE IF NOT EXISTS capsules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        project_name TEXT NOT NULL,
        prompt_title TEXT NOT NULL,
        prompt_version TEXT,
        prompt_text TEXT NOT NULL,
        response_summary TEXT,
        category TEXT,
        usefulness TEXT,
        reviewed INTEGER DEFAULT 0,
        improved INTEGER DEFAULT 0,
        screenshot_url TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(`SQLite database initialized at ${databasePath}.`);
  };
}

module.exports = { pool, initializeDatabase };
