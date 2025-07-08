const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ Webhook GET للتحقق من Facebook
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'my_secret_token'; // 🔁 استبدله بنفس التوكين اللي راح تدخله في Facebook

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    console.log('❌ VERIFICATION_FAILED');
    res.sendStatus(403);
  }
});

// ✅ Webhook POST لاستقبال رسائل واتساب من Meta
app.post('/webhook', (req, res) => {
  console.log('📩 Webhook POST Received:');
  console.dir(req.body, { depth: null });
  res.sendStatus(200); // لازم ترجع 200 حتى يعتبر Meta إنو نجح
});

// ✅ تشغيل السيرفر
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
