
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initializeDatabase() {
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

    console.log("Neon PostgreSQL database initialized successfully.");
  } finally {
    connection.release();
  }
}

module.exports = { pool, initializeDatabase };
