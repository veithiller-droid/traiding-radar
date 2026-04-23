const axios = require('axios');

async function getClaudeAnalysis(payload, grokData) {
  try {
    const atr = parseFloat(payload.atr) || 0;
    const price = parseFloat(payload.price);
    const isLong = payload.direction === 'LONG';

    const tp1 = isLong ? price + atr : price - atr;
    const tp2 = isLong ? price + atr * 2 : price - atr * 2;
    const sl  = isLong ? price - atr : price + atr;
    const rr  = atr > 0 ? (Math.abs(tp2 - price) / Math.abs(sl - price)).toFixed(1) : 'n/a';

    const prompt = `Du bist ein erfahrener Crypto-Futures-Trader. Analysiere dieses Signal kurz und präzise.

Signal-Daten:
- Coin: ${payload.coin}
- Richtung: ${payload.direction}
- Preis: ${price}
- RSI: ${payload.rsi}
- EMA50: ${payload.ema50}
- EMA200: ${payload.ema200}
- ATR(14): ${atr}
- Bull Divergenz: ${payload.bull_div || false}
- Bear Divergenz: ${payload.bear_div || false}

Berechnete Levels (ATR-basiert):
- Entry: ${price}
- TP1: ${tp1.toFixed(4)} (1x ATR)
- TP2: ${tp2.toFixed(4)} (2x ATR)
- SL: ${sl.toFixed(4)} (1x ATR gegen Trade)
- RR: 1:${rr}

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
  "invalidation": "wann ist das Signal ungültig",
  "tp1": "${tp1.toFixed(4)}",
  "tp2": "${tp2.toFixed(4)}",
  "sl": "${sl.toFixed(4)}",
  "rr": "1:${rr}"
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
      invalidation: '-',
      tp1: '-',
      tp2: '-',
      sl: '-',
      rr: '-'
    };
  }
}

module.exports = { getClaudeAnalysis };