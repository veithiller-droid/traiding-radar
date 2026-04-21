require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/webhook', require('./routes/webhook'));
app.use('/api/signals', require('./routes/signals'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Trading Radar running on port ${PORT}`);
  });
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
