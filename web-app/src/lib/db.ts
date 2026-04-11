import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

export async function initSchema() {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS peckerheckler`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS peckerheckler.notify_me (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      product_id TEXT NOT NULL,
      notes      TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE peckerheckler.notify_me ADD COLUMN IF NOT EXISTS notes TEXT
  `);
  await pool.query(`
    ALTER TABLE peckerheckler.notify_me ADD COLUMN IF NOT EXISTS investment_size_usd INTEGER
  `);
}

export default pool;
