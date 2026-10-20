const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// No hardcoded token: credentials must come from the environment.
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('[FATAL] META_ACCESS_TOKEN environment variable is required.');
  if (require.main === module) process.exit(1);
}

async function sendWhatsAppMessage(phoneNumberId, toPhone, otpCode = '123456') {
  if (!phoneNumberId || !toPhone) {
    console.error('Error: phoneNumberId and toPhone are required.');
    console.log('Usage: node sendWhatsAppOtp.js <PHONE_NUMBER_ID> <TO_PHONE_NUMBER> [OTP_CODE]');
    return;
  }

  // Sanitize phone: remove '+' or spaces
  const cleanTo = toPhone.replace(/[^0-9]/g, '');

  // 1. Try sending 'hello_world' template first (Meta default verified test template)
  const templatePayload = JSON.stringify({
    messaging_product: 'whatsapp',
    to: cleanTo,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US',
      },
    },
  });

  console.log(`\n[1] Attempting to send 'hello_world' test template to +${cleanTo}...`);
  await callMetaApi(phoneNumberId, templatePayload);

  // 2. Also try sending direct OTP text message
  const textPayload = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'text',
    text: {
      preview_url: false,
      body: `Your Prepora verification code is: *${otpCode}*.\nValid for 10 minutes. Do not share this OTP with anyone.`,
    },
  });

  console.log(`\n[2] Attempting to send OTP text message (${otpCode}) to +${cleanTo}...`);
  await callMetaApi(phoneNumberId, textPayload);
}

function callMetaApi(phoneNumberId, postData) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v21.0/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Response body:', data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Request Error: ${e.message}`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// Read CLI args
const args = process.argv.slice(2);
const phoneId = args[0];
const targetPhone = args[1];
const testOtp = args[2] || Math.floor(100000 + Math.random() * 900000).toString();

if (phoneId && targetPhone) {
  sendWhatsAppMessage(phoneId, targetPhone, testOtp);
} else {
  module.exports = { sendWhatsAppMessage };
}
