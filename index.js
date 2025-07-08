const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// إعداداتك
const CHATWOOT_BASE_URL = 'https://app.chatwoot.com/webhooks/whatsapp/+15557844350';
const CHATWOOT_API_TOKEN = 'b1a85333cc9c4654997aa94ef116095f';
const CHATWOOT_ACCOUNT_ID = '126907'; // عادة 1 إذا حساب واحد
const CHATWOOT_INBOX_ID = '0';

const WHATSAPP_PHONE_NUMBER_ID = '15557844350'; // من Meta
const WHATSAPP_ACCESS_TOKEN = 'EAAO0b9TZCW6EBPJqz9Y3i54UgVHnhC1VLAEMxw0ROji9PtmgSmxfp9W0kLCtZCIJNVBxbXjUHklTRuSrgR02dJypVKwj7ZCg8xPl3YO13HIMnWmRmepTob3FX30ZCD99nPTpg08rZAJJtJOHOCP3klVopTIf2F4NkxsOm1QfrWpmZBNKu4zUWaswj2SrbW7LmjRz6Vr2ZANSbgJgwaFv8vmR4nfRQWxYQNTda8fn4RbY0VjsQZDZD';

// === استقبال webhook من WhatsApp Cloud API ===
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'my_secret_token';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const contact = message?.from;
    const msgBody = message?.text?.body;

    if (message && contact && msgBody) {
      // أرسل الرسالة إلى Chatwoot كرسالة واردة
      await axios.post(
        `${CHATWOOT_BASE_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/conversations`,
        {
          source_id: `whatsapp_${contact}`,
          inbox_id: CHATWOOT_INBOX_ID,
          contact: {
            name: contact,
            phone_number: contact,
          },
          messages: [
            {
              content: msgBody,
              message_type: 'incoming',
            },
          ],
        },
        {
          headers: {
            api_access_token: CHATWOOT_API_TOKEN,
          },
        }
      );

      console.log('✅ رسالة جديدة من WhatsApp تم إرسالها لـ Chatwoot');
    }
  } catch (error) {
    console.error('❌ خطأ في استقبال رسالة WhatsApp:', error.message);
  }
  res.sendStatus(200);
});

// === استقبال webhook من Chatwoot ===
// يجب تفعيل Webhook في Chatwoot ليشير إلى هذا الرابط
app.post('/chatwoot-webhook', async (req, res) => {
  try {
    const message = req.body.message;
    // تحقق إنو الرسالة من الوكيل (outgoing)
    if (message && message.message_type === 'outgoing') {
      const conversation = req.body.conversation;
      const contactId = conversation?.contact_inbox?.source_id; // لازم يحتوي 'whatsapp_...'

      if (contactId && contactId.startsWith('whatsapp_')) {
        const to = contactId.replace('whatsapp_', '');
        const text = message.content;

        // أرسل رسالة عبر WhatsApp Cloud API
        await axios.post(
          `https://graph.facebook.com/v15.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: to,
            text: { body: text },
          },
          {
            headers: {
              Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ رد من Chatwoot أرسل عبر WhatsApp');
      }
    }
  } catch (error) {
    console.error('❌ خطأ في إرسال رسالة WhatsApp:', error.message);
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
