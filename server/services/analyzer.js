const { getGrokSentiment } = require('./grok');
const { getClaudeAnalysis } = require('./claude');
const { pool } = require('../db');

async function analyzeAndStore(payload) {
  console.log(`Analyzing ${payload.coin} ${payload.direction}...`);

  const grokData = await getGrokSentiment(payload.coin);
  const claudeData = await getClaudeAnalysis(payload, grokData);

  const signalType = payload.signal_type || null;
  const typeLabel = signalType === 'LONG-R' || signalType === 'SHORT-R' ? 'Reversal' :
                    signalType === 'LONG-H' || signalType === 'SHORT-H' ? 'Hidden Div' :
                    signalType === 'LONG-M' || signalType === 'SHORT-M' ? 'Momentum' : '';

  const summary = `${payload.coin} ${payload.direction}${typeLabel ? ' [' + typeLabel + ']' : ''} – ${claudeData.technical} Sentiment: ${grokData.sentiment}.`;

  const result = await pool.query(
    `INSERT INTO signals 
      (coin, direction, signal_type, price, rsi, ema50, ema200, timeframe, bull_div, bear_div, summary, analysis)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      payload.coin,
      payload.direction,
      signalType,
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

  console.log(`Signal saved: ID ${result.rows[0].id} Type: ${signalType}`);
  return result.rows[0];
}

module.exports = { analyzeAndStore };