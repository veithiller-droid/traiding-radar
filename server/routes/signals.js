const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Alle Signals – für Dashboard Liste
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const coin = req.query.coin;

    let query = `SELECT id, coin, direction, price, rsi, summary, created_at 
                 FROM signals`;
    const params = [];

    if (coin) {
      query += ` WHERE coin = $1`;
      params.push(coin.toUpperCase());
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Detail eines Signals – für Klick im Dashboard
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM signals WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM signals WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;
