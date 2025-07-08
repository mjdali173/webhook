const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// بيانات Chatwoot
const CHATWOOT_API_URL = 'https://your-chatwoot-instance.com/api/v1';
const CHATWOOT_API_TOKEN = 'your_chatwoot_api_token';
const INBOX_ID = 'your_inbox_id'; // ID الصندوق الذي أنشأته في Chatwoot

// بيانات WhatsApp
const WHATSAPP_ACCESS_TOKEN = 'your_whatsapp_access_token';
const WHATSAPP_PHONE_NUMBER_ID = 'your_phone_number_id';

// 1. استقبال Webhook من WhatsApp (الرسائل الواردة)
app.post('/webhook', async (req, res) => {
    const VERIFY_TOKEN = 'my_verify_token';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }

  const webhookData = req.body;

  // تحقق من نوع الرسالة حسب هيكل WhatsApp Cloud API
  if (webhookData.entry) {
    for (const entry of webhookData.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.value && change.value.messages) {
            for (const message of change.value.messages) {
              // بيانات المرسل والرسالة
              const sender = message.from; // رقم المرسل
              const text = message.text?.body || '';

              // أرسل رسالة إلى Chatwoot كرسالة واردة
              await axios.post(
                `${CHATWOOT_API_URL}/accounts/1/inboxes/${INBOX_ID}/contacts`,
                {
                  source_id: sender,
                  inbox_id: INBOX_ID,
                  name: sender,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': CHATWOOT_API_TOKEN,
                  },
                }
              );

              await axios.post(
                `${CHATWOOT_API_URL}/accounts/1/inboxes/${INBOX_ID}/conversations`,
                {
                  contact_source_id: sender,
                  inbox_id: INBOX_ID,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': CHATWOOT_API_TOKEN,
                  },
                }
              );

              await axios.post(
                `${CHATWOOT_API_URL}/accounts/1/conversations/${sender}/messages`,
                {
                  content: text,
                  message_type: 'incoming',
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': CHATWOOT_API_TOKEN,
                  },
                }
              );
            }
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

// 2. إرسال رسالة من Chatwoot إلى WhatsApp
// يجب إعداد webhook أو listener في Chatwoot لرسائل الصادرة (غير مشمول هنا)
// مثال لإرسال رسالة عبر WhatsApp Cloud API:

async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: "whatsapp",
    to: to,
    text: { body: text },
  };

  await axios.post(url, data, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
}

// مثال على تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
