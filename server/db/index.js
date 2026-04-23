const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signals (
      id SERIAL PRIMARY KEY,
      coin VARCHAR(10) NOT NULL,
      direction VARCHAR(10) NOT NULL,
      price NUMERIC,
      rsi NUMERIC,
      ema50 NUMERIC,
      ema200 NUMERIC,
      timeframe VARCHAR(10),
      confluence INTEGER,
      bull_div BOOLEAN,
      bear_div BOOLEAN,
      summary TEXT,
      analysis JSONB,
      source VARCHAR(20) DEFAULT 'webhook',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_signals_coin ON signals(coin);
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      signal_id INTEGER REFERENCES signals(id),
      coin VARCHAR(20) NOT NULL,
      direction VARCHAR(10) NOT NULL,
      signal_price NUMERIC,
      entry_price NUMERIC,
      position_size NUMERIC,
      tp1 NUMERIC,
      tp2 NUMERIC,
      sl NUMERIC,
      status VARCHAR(10) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      closed_at TIMESTAMPTZ
    );
  `);
  console.log('DB initialized');
}

module.exports = { pool, initDB };