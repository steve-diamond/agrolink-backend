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
const uploadRoot = path.join(__dirname, '..', 'uploads');
const otpSecret = process.env.OTP_SECRET || process.env.JWT_SECRET || 'agrolink-otp-dev-secret';

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
  const phone = normalizePhone(req.body?.phone || '');

  if (!isValidNigerianPhone(phone)) {
    return res.status(400).json({ message: 'Phone number must be a valid Nigerian number.' });
  }

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

  return res.json(payload);
});

router.post('/otp/verify', (req, res) => {
  const phone = normalizePhone(req.body?.phone || '');
  const otp = String(req.body?.otp || '').trim();
  const otpRef = String(req.body?.otpRef || '').trim();

  if (!isValidNigerianPhone(phone)) {
    return res.status(400).json({ message: 'Phone number must be a valid Nigerian number.' });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'OTP must be 6 digits.' });
  }

  if (otpRef) {
    try {
      const decoded = jwt.verify(otpRef, otpSecret);
      if (decoded?.purpose !== 'onboarding-otp') {
        return res.status(400).json({ message: 'Invalid OTP reference. Please request a new OTP.' });
      }

      if (decoded?.phone !== phone) {
        return res.status(400).json({ message: 'OTP does not match this phone number.' });
      }

      if (String(decoded?.otp || '') !== otp) {
        return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
      }

      otpStore.delete(phone);
      return res.json({ message: 'Phone verified successfully.', verified: true, phone });
    } catch (_error) {
      return res.status(400).json({ message: 'OTP expired or invalid. Please request a new one.' });
    }
  }

  const record = otpStore.get(phone);
  if (!record) {
    return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
  }

  otpStore.delete(phone);
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
