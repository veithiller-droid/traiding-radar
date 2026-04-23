const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Aktiven Trade holen
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trades WHERE status = 'active' ORDER BY created_at DESC LIMIT 1`
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Trade speichern
router.post('/', async (req, res) => {
  try {
    const { signal_id, coin, direction, signal_price, entry_price, position_size, tp1, tp2, sl } = req.body;

    // Vorherige aktive Trades schließen
    await pool.query(`UPDATE trades SET status = 'closed', closed_at = NOW() WHERE status = 'active'`);

    const result = await pool.query(
      `INSERT INTO trades (signal_id, coin, direction, signal_price, entry_price, position_size, tp1, tp2, sl)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [signal_id, coin, direction, signal_price, entry_price, position_size, tp1, tp2, sl]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Trade schließen
router.patch('/close', async (req, res) => {
  try {
    await pool.query(`UPDATE trades SET status = 'closed', closed_at = NOW() WHERE status = 'active'`);
    res.json({ closed: true });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;