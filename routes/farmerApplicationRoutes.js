const express = require('express');
const FarmerApplication = require('../models/FarmerApplication');

const router = express.Router();

const ALLOWED_VERIFICATION_CHANNELS = ['email', 'whatsapp'];

const sanitizePreferredVerification = (application = {}) => {
  const preferredVerification = String(application?.preferredVerification || '').trim().toLowerCase();
  if (!ALLOWED_VERIFICATION_CHANNELS.includes(preferredVerification)) return null;
  return preferredVerification;
};

const buildApplicationId = () => {
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `AGR-${random}`;
};

const buildSubmissionMeta = (applicationId, application) => {
  const hasId = Boolean(application?.idPhotoName || application?.idPhotoUrl);
  const preferredVerification = sanitizePreferredVerification(application) || 'email';
  return {
    farmerId: applicationId,
    kycPending: !hasId,
    preferredVerification,
    verificationChannelMessage:
      preferredVerification === 'whatsapp'
        ? 'Verification updates will be sent via WhatsApp.'
        : 'Verification updates will be sent via email.',
    smsTemplate: `Your Dos Agrolink farmer ID is ${applicationId}. Use this to log in. Welcome!`,
  };
};

router.get('/status', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    const phone = String(req.query.phone || '').trim();
    const applicationId = String(req.query.applicationId || '').trim();

    if (!email && !phone && !applicationId) {
      return res.status(400).json({
        message: 'Provide at least one identifier: email, phone, or applicationId.',
      });
    }

    const query = {};
    if (applicationId) {
      query.applicationId = applicationId;
    } else if (email) {
      query['account.email'] = email;
    } else if (phone) {
      query['account.phone'] = phone;
    }

    const application = await FarmerApplication.findOne(query).lean();
    if (!application) {
      return res.status(404).json({ message: 'Farmer application not found.' });
    }

    return res.json({
      applicationId: application.applicationId,
      status: application.status,
      account: application.account,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      ...buildSubmissionMeta(application.applicationId, application.application),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load application status.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { account, application, status } = req.body;

    if (!account?.name || !account?.email || !account?.phone) {
      return res.status(400).json({ message: 'Account name, email, and phone are required.' });
    }

    if (!application || typeof application !== 'object') {
      return res.status(400).json({ message: 'Application payload is required.' });
    }

    const preferredVerification = sanitizePreferredVerification(application);
    if (!preferredVerification) {
      return res.status(400).json({ message: 'preferredVerification must be either email or whatsapp.' });
    }

    const email = String(account.email).trim().toLowerCase();
    const normalizedApplication = {
      ...application,
      preferredVerification,
    };

    const existing = await FarmerApplication.findOne({ 'account.email': email });
    const nextStatus = ['draft', 'submitted', 'queued'].includes(status) ? status : 'submitted';

    if (existing) {
      existing.account = {
        name: String(account.name).trim(),
        email,
        phone: String(account.phone).trim(),
      };
      existing.application = normalizedApplication;
      existing.status = nextStatus;
      if (!existing.applicationId) {
        existing.applicationId = buildApplicationId();
      }

      await existing.save();

      return res.json({
        message: 'Farmer application updated successfully.',
        applicationId: existing.applicationId,
        status: existing.status,
        ...buildSubmissionMeta(existing.applicationId, existing.application),
      });
    }

    const record = await FarmerApplication.create({
      applicationId: buildApplicationId(),
      status: nextStatus,
      account: {
        name: String(account.name).trim(),
        email,
        phone: String(account.phone).trim(),
      },
      application: normalizedApplication,
    });

    return res.status(201).json({
      message: 'Farmer application submitted successfully.',
      applicationId: record.applicationId,
      status: record.status,
      ...buildSubmissionMeta(record.applicationId, record.application),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to save farmer application.' });
  }
});

router.get('/:email', async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const application = await FarmerApplication.findOne({ 'account.email': email }).lean();

    if (!application) {
      return res.status(404).json({ message: 'Farmer application not found.' });
    }

    return res.json(application);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load farmer application.' });
  }
});

module.exports = router;
