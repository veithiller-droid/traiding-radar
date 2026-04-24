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

// Entry/Position updaten
router.patch('/:id/update', async (req, res) => {
  try {
    const { entry_price, position_size } = req.body;
    await pool.query(
      `UPDATE trades SET entry_price = $1, position_size = $2 WHERE id = $3`,
      [entry_price, position_size, req.params.id]
    );
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

// Trade schließen mit Exit-Preis und PnL
router.patch('/:id/close', async (req, res) => {
  try {
    const { exit_price } = req.body;

    // Trade holen für PnL Berechnung
    const tradeRes = await pool.query(`SELECT * FROM trades WHERE id = $1`, [req.params.id]);
    const trade = tradeRes.rows[0];

    let pnl_dollar = null;
    let pnl_percent = null;
    let result = null;

    if (trade && trade.entry_price && trade.position_size && exit_price) {
      const entry = parseFloat(trade.entry_price);
      const position = parseFloat(trade.position_size);
      const exit = parseFloat(exit_price);
      const coins = position / entry;
      const mult = trade.direction === 'LONG' ? 1 : -1;

      pnl_dollar = (exit - entry) * coins * mult;
      pnl_percent = ((exit - entry) / entry) * 100 * mult;
      result = pnl_dollar > 0 ? 'WIN' : pnl_dollar < 0 ? 'LOSS' : 'BREAKEVEN';
    }

    await pool.query(
      `UPDATE trades SET 
        status = 'closed', 
        closed_at = NOW(),
        exit_price = $1,
        pnl_dollar = $2,
        pnl_percent = $3,
        result = $4
       WHERE id = $5`,
      [exit_price || null, pnl_dollar, pnl_percent, result, req.params.id]
    );

    res.json({ closed: true, pnl_dollar, result });
  } catch (err) {
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;