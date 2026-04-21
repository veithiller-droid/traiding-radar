const axios = require('axios');

async function getClaudeAnalysis(payload, grokData) {
  try {
    const prompt = `Du bist ein erfahrener Crypto-Futures-Trader. Analysiere dieses Signal kurz und präzise.

Signal-Daten:
- Coin: ${payload.coin}
- Richtung: ${payload.direction}
- Preis: ${payload.price}
- RSI: ${payload.rsi}
- EMA50: ${payload.ema50}
- EMA200: ${payload.ema200}
- Timeframe: ${payload.timeframe}h
- Bull Divergenz: ${payload.bull_div || false}
- Bear Divergenz: ${payload.bear_div || false}

News/Sentiment (Grok):
- Sentiment: ${grokData.sentiment}
- Summary: ${grokData.summary}
- Key Event: ${grokData.key_event || 'keins'}

Antworte NUR in diesem JSON Format ohne Markdown:
{
  "strength": "stark|mittel|schwach",
  "technical": "max 1 Satz technische Einschätzung",
  "confluence": "was spricht dafür",
  "risk": "was könnte schiefgehen",
  "entry_note": "Einstiegshinweis",
  "invalidation": "wann ist das Signal ungültig"
}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const text = response.data.content[0].text;
    return JSON.parse(text);
  } catch (err) {
    console.error('Claude error:', err.message);
    return {
      strength: 'unknown',
      technical: 'Analyse nicht verfügbar',
      confluence: '-',
      risk: '-',
      entry_note: '-',
      invalidation: '-'
    };
  }
}

module.exports = { getClaudeAnalysis };
