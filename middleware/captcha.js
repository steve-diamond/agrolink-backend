const axios = require('axios');

module.exports = async function verifyCaptcha(req, res, next) {
  const captcha = req.body.captcha;
  if (!captcha) {
    return res.status(400).json({ status: 'error', message: 'CAPTCHA required.' });
  }
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret,
          response: captcha,
          remoteip: req.ip,
        },
      }
    );
    if (!response.data.success) {
      return res.status(400).json({ status: 'error', message: 'CAPTCHA verification failed.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'CAPTCHA verification error.' });
  }
};
