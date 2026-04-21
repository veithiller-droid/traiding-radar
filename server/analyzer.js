const { getGrokSentiment } = require('./services/grok');
const { getClaudeAnalysis } = require('./services/claude');
const { pool } = require('../db');

async function analyzeAndStore(payload) {
  console.log(`Analyzing ${payload.coin} ${payload.direction}...`);

  // Parallel: Grok + Claude
  const grokData = await getGrokSentiment(payload.coin);
  const claudeData = await getClaudeAnalysis(payload, grokData);

  // Summary für Signal-Card
  const summary = `${payload.coin} ${payload.direction} – ${claudeData.technical} Sentiment: ${grokData.sentiment}.`;

  // In DB speichern
  const result = await pool.query(
    `INSERT INTO signals 
      (coin, direction, price, rsi, ema50, ema200, timeframe, bull_div, bear_div, summary, analysis)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      payload.coin,
      payload.direction,
      payload.price,
      payload.rsi,
      payload.ema50,
      payload.ema200,
      payload.timeframe,
      payload.bull_div === 'true' || payload.bull_div === true,
      payload.bear_div === 'true' || payload.bear_div === true,
      summary,
      JSON.stringify({ grok: grokData, claude: claudeData })
    ]
  );

  console.log(`Signal saved: ID ${result.rows[0].id}`);
  return result.rows[0];
}

module.exports = { analyzeAndStore };
