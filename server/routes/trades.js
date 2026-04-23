const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Alle aktiven Trades holen
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trades WHERE status = 'active' ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Trade speichern
router.post('/', async (req, res) => {
  try {
    const { signal_id, coin, direction, signal_price, entry_price, position_size, tp1, tp2, sl } = req.body;

    // Vorherigen Trade für denselben Coin schließen
    await pool.query(
      `UPDATE trades SET status = 'closed', closed_at = NOW() WHERE status = 'active' AND coin = $1`,
      [coin]
    );

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

// Einzelnen Trade schließen
router.patch('/:id/close', async (req, res) => {
  try {
    await pool.query(
      `UPDATE trades SET status = 'closed', closed_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ closed: true });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;