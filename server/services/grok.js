const axios = require('axios');

async function getGrokSentiment(coin) {
  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-2-latest',
        messages: [
          {
            role: 'user',
            content: `Aktuelle News und Sentiment für ${coin} in den letzten 24 Stunden. 
            Antworte NUR in diesem JSON Format ohne Markdown:
            {"sentiment":"bullish|bearish|neutral","summary":"max 2 Sätze auf Deutsch","key_event":"wichtigstes Event oder null"}`
          }
        ],
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const text = response.data.choices[0].message.content;
    return JSON.parse(text);
  } catch (err) {
    console.error('Grok error:', err.message);
    return { sentiment: 'unknown', summary: 'News nicht verfügbar', key_event: null };
  }
}

module.exports = { getGrokSentiment };
