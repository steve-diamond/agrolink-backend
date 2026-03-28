// Example SMS service integration (Twilio, Termii, etc.)
const axios = require('axios');

// Replace with your SMS provider's API details
const SMS_API_URL = process.env.SMS_API_URL || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
const SMS_SENDER = process.env.SMS_SENDER || 'Agrolink';

async function sendSMS(to, message) {
  if (!SMS_API_URL || !SMS_API_KEY) {
    console.log('SMS API not configured. Skipping SMS:', message);
    return;
  }
  // Example for Termii
  await axios.post(SMS_API_URL, {
    to,
    sms: message,
    from: SMS_SENDER,
    type: 'plain',
    channel: 'generic',
    api_key: SMS_API_KEY,
  });
}

module.exports = { sendSMS };
