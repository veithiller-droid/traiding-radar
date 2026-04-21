const express = require('express');
const router = express.Router();
const { analyzeAndStore } = require('../services/analyzer');

router.post('/', async (req, res) => {
  try {
    // Optional: Secret Token prüfen
    const secret = req.headers['x-webhook-secret'];
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body;
    console.log('Webhook received:', payload);

    // Pflichtfelder prüfen
    if (!payload.coin || !payload.direction || !payload.price) {
      return res.status(400).json({ error: 'Missing required fields: coin, direction, price' });
    }

    // Sofort 200 zurück – Analyse läuft async
    res.json({ status: 'received', coin: payload.coin, direction: payload.direction });

    // Analyse im Hintergrund
    await analyzeAndStore(payload);

  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
