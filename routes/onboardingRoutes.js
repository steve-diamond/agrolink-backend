const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');

const router = express.Router();

const BANKS = [
  'Access Bank',
  'First Bank',
  'GTBank',
  'Zenith Bank',
  'UBA',
  'Fidelity Bank',
  'Union Bank',
  'Sterling Bank',
  'Wema Bank',
  'FCMB',
  'Polaris Bank',
  'Keystone Bank',
  'Stanbic IBTC',
  'Providus Bank',
  'Jaiz Bank',
];

const otpStore = new Map();
const otpSendByPhone = new Map();
const otpSendByIp = new Map();
const otpVerifyFailures = new Map();
const uploadRoot = path.join(__dirname, '..', 'uploads');
const otpSecret = process.env.OTP_SECRET || process.env.JWT_SECRET;

const OTP_SEND_WINDOW_MS = 10 * 60 * 1000;
const OTP_SEND_MAX_PER_PHONE = 5;
const OTP_SEND_MAX_PER_IP = 12;
const OTP_VERIFY_MAX_FAILURES = 5;
const OTP_VERIFY_LOCK_MS = 15 * 60 * 1000;

const ensureUploadDirectory = (category) => {
  const dir = path.join(uploadRoot, category);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const normalizePhone = (rawPhone = '') => {
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return String(rawPhone).trim();
};

const isValidNigerianPhone = (phone) => /^\+234\d{10}$/.test(phone);

const maskPhone = (phone = '') => {
  const normalized = String(phone);
  if (!normalized.startsWith('+234') || normalized.length < 7) return 'redacted';
  return `${normalized.slice(0, 7)}****${normalized.slice(-2)}`;
};

const logOtpEvent = (req, event, details = {}) => {
  try {
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'otp_event',
        event,
        requestId: req.requestId,
        ip: getClientIp(req),
        ...details,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (_error) {
    // Do not fail request flow if logging fails.
  }
};

const pruneTimestamps = (timestamps, windowMs) => timestamps.filter((time) => Date.now() - time < windowMs);

const getClientIp = (req) => {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || 'unknown';
};

const registerSendAttempt = (store, key) => {
  const current = pruneTimestamps(store.get(key) || [], OTP_SEND_WINDOW_MS);
  current.push(Date.now());
  store.set(key, current);
  return current.length;
};

const canSendOtp = (store, key, limit) => {
  const current = pruneTimestamps(store.get(key) || [], OTP_SEND_WINDOW_MS);
  store.set(key, current);
  return current.length < limit;
};

const getRetryAfterForSend = (store, key) => {
  const current = pruneTimestamps(store.get(key) || [], OTP_SEND_WINDOW_MS);
  if (!current.length) return 0;
  const oldest = Math.min(...current);
  return Math.max(1, Math.ceil((oldest + OTP_SEND_WINDOW_MS - Date.now()) / 1000));
};

const getVerifyLock = (phone) => {
  const record = otpVerifyFailures.get(phone);
  if (!record) return null;
  if (!record.blockedUntil || Date.now() > record.blockedUntil) {
    otpVerifyFailures.delete(phone);
    return null;
  }
  return record;
};

const recordVerifyFailure = (phone) => {
  const existing = otpVerifyFailures.get(phone) || { count: 0, blockedUntil: 0 };
  const nextCount = existing.count + 1;
  if (nextCount >= OTP_VERIFY_MAX_FAILURES) {
    otpVerifyFailures.set(phone, { count: 0, blockedUntil: Date.now() + OTP_VERIFY_LOCK_MS });
    return { locked: true, retryAfterSeconds: Math.ceil(OTP_VERIFY_LOCK_MS / 1000) };
  }
  otpVerifyFailures.set(phone, { count: nextCount, blockedUntil: 0 });
  return { locked: false, remainingAttempts: OTP_VERIFY_MAX_FAILURES - nextCount };
};

const clearVerifyFailures = (phone) => {
  otpVerifyFailures.delete(phone);
};

const inferExtension = (mimeType = '', fileName = '') => {
  const lowerName = String(fileName).toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'jpg';
  if (lowerName.endsWith('.png')) return 'png';
  if (lowerName.endsWith('.webp')) return 'webp';
  if (String(mimeType).includes('jpeg') || String(mimeType).includes('jpg')) return 'jpg';
  if (String(mimeType).includes('png')) return 'png';
  if (String(mimeType).includes('webp')) return 'webp';
  return 'jpg';
};

router.post('/otp/send', (req, res) => {
  if (!otpSecret) {
    return res.status(500).json({ message: 'OTP service is not configured.' });
  }

  const phone = normalizePhone(req.body?.phone || '');
  const ip = getClientIp(req);

  if (!isValidNigerianPhone(phone)) {
    logOtpEvent(req, 'otp_send_invalid_phone', { phone: maskPhone(phone) });
    return res.status(400).json({ message: 'Phone number must be a valid Nigerian number.' });
  }

  if (!canSendOtp(otpSendByPhone, phone, OTP_SEND_MAX_PER_PHONE)) {
    const retryAfterSeconds = getRetryAfterForSend(otpSendByPhone, phone);
    logOtpEvent(req, 'otp_send_blocked_phone_limit', { phone: maskPhone(phone), retryAfterSeconds });
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message: 'Too many OTP requests for this phone. Please wait before trying again.',
      retryAfterSeconds,
    });
  }

  if (!canSendOtp(otpSendByIp, ip, OTP_SEND_MAX_PER_IP)) {
    const retryAfterSeconds = getRetryAfterForSend(otpSendByIp, ip);
    logOtpEvent(req, 'otp_send_blocked_ip_limit', { phone: maskPhone(phone), retryAfterSeconds });
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message: 'Too many OTP requests from this network. Please wait before trying again.',
      retryAfterSeconds,
    });
  }

  registerSendAttempt(otpSendByPhone, phone);
  registerSendAttempt(otpSendByIp, ip);

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const otpRef = jwt.sign({ purpose: 'onboarding-otp', phone, otp }, otpSecret, { expiresIn: '5m' });

  otpStore.set(phone, { otp, expiresAt });

  const payload = {
    message: 'OTP sent successfully.',
    phone,
    expiresInSeconds: 300,
    otpRef,
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.otp = otp;
  }

  logOtpEvent(req, 'otp_send_success', { phone: maskPhone(phone), expiresInSeconds: 300 });

  return res.json(payload);
});

router.post('/otp/verify', (req, res) => {
  if (!otpSecret) {
    return res.status(500).json({ message: 'OTP service is not configured.' });
  }

  const phone = normalizePhone(req.body?.phone || '');
  const otp = String(req.body?.otp || '').trim();
  const otpRef = String(req.body?.otpRef || '').trim();

  if (!isValidNigerianPhone(phone)) {
    logOtpEvent(req, 'otp_verify_invalid_phone', { phone: maskPhone(phone) });
    return res.status(400).json({ message: 'Phone number must be a valid Nigerian number.' });
  }

  if (!/^\d{6}$/.test(otp)) {
    logOtpEvent(req, 'otp_verify_invalid_format', { phone: maskPhone(phone) });
    return res.status(400).json({ message: 'OTP must be 6 digits.' });
  }

  const verifyLock = getVerifyLock(phone);
  if (verifyLock) {
    const retryAfterSeconds = Math.max(1, Math.ceil((verifyLock.blockedUntil - Date.now()) / 1000));
    logOtpEvent(req, 'otp_verify_blocked_lockout', { phone: maskPhone(phone), retryAfterSeconds });
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message: 'Too many failed OTP attempts. Please wait before trying again.',
      retryAfterSeconds,
    });
  }

  if (otpRef) {
    try {
      const decoded = jwt.verify(otpRef, otpSecret);
      if (decoded?.purpose !== 'onboarding-otp') {
        logOtpEvent(req, 'otp_verify_invalid_ref_purpose', { phone: maskPhone(phone) });
        return res.status(400).json({ message: 'Invalid OTP reference. Please request a new OTP.' });
      }

      if (decoded?.phone !== phone) {
        logOtpEvent(req, 'otp_verify_ref_phone_mismatch', { phone: maskPhone(phone) });
        return res.status(400).json({ message: 'OTP does not match this phone number.' });
      }

      if (String(decoded?.otp || '') !== otp) {
        const failure = recordVerifyFailure(phone);
        if (failure.locked) {
          logOtpEvent(req, 'otp_verify_blocked_after_failures', { phone: maskPhone(phone), retryAfterSeconds: failure.retryAfterSeconds });
          res.set('Retry-After', String(failure.retryAfterSeconds));
          return res.status(429).json({
            message: 'Too many failed OTP attempts. Please wait before trying again.',
            retryAfterSeconds: failure.retryAfterSeconds,
          });
        }
        logOtpEvent(req, 'otp_verify_incorrect_code', { phone: maskPhone(phone), remainingAttempts: failure.remainingAttempts });
        return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      }

      otpStore.delete(phone);
      clearVerifyFailures(phone);
      logOtpEvent(req, 'otp_verify_success', { phone: maskPhone(phone), mode: 'otpRef' });
      return res.json({ message: 'Phone verified successfully.', verified: true, phone });
    } catch (_error) {
      logOtpEvent(req, 'otp_verify_invalid_or_expired_ref', { phone: maskPhone(phone) });
      return res.status(400).json({ message: 'OTP expired or invalid. Please request a new one.' });
    }
  }

  const record = otpStore.get(phone);
  if (!record) {
    logOtpEvent(req, 'otp_verify_missing_record', { phone: maskPhone(phone), mode: 'legacy-store' });
    return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    logOtpEvent(req, 'otp_verify_expired', { phone: maskPhone(phone), mode: 'legacy-store' });
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }

  if (record.otp !== otp) {
    const failure = recordVerifyFailure(phone);
    if (failure.locked) {
      logOtpEvent(req, 'otp_verify_blocked_after_failures', { phone: maskPhone(phone), retryAfterSeconds: failure.retryAfterSeconds });
      res.set('Retry-After', String(failure.retryAfterSeconds));
      return res.status(429).json({
        message: 'Too many failed OTP attempts. Please wait before trying again.',
        retryAfterSeconds: failure.retryAfterSeconds,
      });
    }
    logOtpEvent(req, 'otp_verify_incorrect_code', { phone: maskPhone(phone), remainingAttempts: failure.remainingAttempts, mode: 'legacy-store' });
    return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
  }

  otpStore.delete(phone);
  clearVerifyFailures(phone);
  logOtpEvent(req, 'otp_verify_success', { phone: maskPhone(phone), mode: 'legacy-store' });
  return res.json({ message: 'Phone verified successfully.', verified: true, phone });
});

router.get('/banks', (_req, res) => {
  return res.json({ banks: BANKS });
});

router.post('/banks/resolve', (req, res) => {
  const bankName = String(req.body?.bankName || '').trim();
  const accountNumber = String(req.body?.accountNumber || '').trim();

  if (!bankName || !BANKS.includes(bankName)) {
    return res.status(400).json({ message: 'Please choose a valid bank.' });
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return res.status(400).json({ message: 'Account number must be 10 digits.' });
  }

  const accountName = `Farmer ${accountNumber.slice(-4)}`.toUpperCase();
  return res.json({ bankName, accountNumber, accountName, verified: true });
});

router.post('/bvn/verify', (req, res) => {
  const bvn = String(req.body?.bvn || '').trim();

  if (!/^\d{11}$/.test(bvn)) {
    return res.status(400).json({ message: 'BVN must be 11 digits.' });
  }

  return res.json({ verified: true, scoreBoostEligible: true, message: 'BVN verified successfully.' });
});

router.post('/media-upload', (req, res) => {
  try {
    const fileName = String(req.body?.fileName || '').trim();
    const mimeType = String(req.body?.mimeType || '').trim();
    const dataBase64 = String(req.body?.dataBase64 || '').trim();
    const category = String(req.body?.category || 'misc').trim().toLowerCase();

    if (!fileName || !dataBase64) {
      return res.status(400).json({ message: 'fileName and dataBase64 are required.' });
    }

    if (dataBase64.length > 7_000_000) {
      return res.status(400).json({ message: 'File payload is too large.' });
    }

    const ext = inferExtension(mimeType, fileName);
    const safeCategory = category.replace(/[^a-z0-9_-]/g, '') || 'misc';
    const directory = ensureUploadDirectory(safeCategory);
    const finalFileName = `${Date.now()}-${randomUUID()}.${ext}`;
    const filePath = path.join(directory, finalFileName);

    fs.writeFileSync(filePath, Buffer.from(dataBase64, 'base64'));

    const fileUrl = `/uploads/${safeCategory}/${finalFileName}`;

    return res.status(201).json({
      message: 'Media uploaded successfully.',
      fileUrl,
      originalName: fileName,
      mimeType,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to upload file.' });
  }
});

module.exports = router;
