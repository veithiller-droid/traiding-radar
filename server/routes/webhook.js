const express = require('express');
const router = express.Router();
const { analyzeAndStore } = require('../services/analyzer');
const { pool } = require('../db');

router.post('/', async (req, res) => {
  try {
    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body;
    console.log('Webhook received:', payload);

    if (!payload.coin || !payload.direction || !payload.price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Exit Signals separat behandeln
    if (payload.direction === 'LONG_EXIT' || payload.direction === 'SHORT_EXIT') {
      const summary = `${payload.coin} ${payload.direction} – EMA50 Crossover bei $${payload.price}`;

      await pool.query(
        `INSERT INTO signals (coin, direction, price, summary, analysis, source)
         VALUES ($1,$2,$3,$4,$5,'webhook')`,
        [
          payload.coin,
          payload.direction,
          payload.price,
          summary,
          JSON.stringify({ exit: true, ema50: payload.ema50 })
        ]
      );

      return res.json({ status: 'exit_received', coin: payload.coin, direction: payload.direction });
    }

    // Normales Signal
    res.json({ status: 'received', coin: payload.coin, direction: payload.direction });
    await analyzeAndStore(payload);

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;