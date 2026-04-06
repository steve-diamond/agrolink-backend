const express = require('express');
const BuyerApplication = require('../models/BuyerApplication');

const router = express.Router();

const buildApplicationId = () => {
  const random = Math.floor(Math.random() * 90000 + 10000);
  return `AGR-BUY-${random}`;
};

const buildSubmissionMeta = (applicationId, application) => {
  const hasBusinessProof = Boolean(application?.businessProofName || application?.businessProofUrl);
  const hasId = Boolean(application?.idPhotoName || application?.idPhotoUrl);
  return {
    buyerId: applicationId,
    verificationPending: !(hasBusinessProof && hasId),
    reviewSla: '2_business_days',
    smsTemplate: `Your buyer ID is ${applicationId}. Log in to start purchasing.`,
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

    const application = await BuyerApplication.findOne(query).lean();
    if (!application) {
      return res.status(404).json({ message: 'Buyer application not found.' });
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
    return res.status(500).json({ message: error.message || 'Unable to load buyer application status.' });
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

    const email = String(account.email).trim().toLowerCase();
    const nextStatus = ['draft', 'pending', 'approved', 'rejected', 'activation_completed', 'queued'].includes(status)
      ? status
      : 'pending';

    const existing = await BuyerApplication.findOne({ 'account.email': email });

    if (existing) {
      existing.account = {
        name: String(account.name).trim(),
        email,
        phone: String(account.phone).trim(),
      };
      existing.application = application;
      existing.status = nextStatus;
      if (!existing.applicationId) {
        existing.applicationId = buildApplicationId();
      }

      await existing.save();

      return res.json({
        message: 'Buyer application updated successfully.',
        applicationId: existing.applicationId,
        status: existing.status,
        ...buildSubmissionMeta(existing.applicationId, existing.application),
      });
    }

    const record = await BuyerApplication.create({
      applicationId: buildApplicationId(),
      status: nextStatus,
      account: {
        name: String(account.name).trim(),
        email,
        phone: String(account.phone).trim(),
      },
      application,
    });

    return res.status(201).json({
      message: 'Buyer application submitted successfully.',
      applicationId: record.applicationId,
      status: record.status,
      ...buildSubmissionMeta(record.applicationId, record.application),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to save buyer application.' });
  }
});

router.get('/:email', async (req, res) => {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();
    const application = await BuyerApplication.findOne({ 'account.email': email }).lean();

    if (!application) {
      return res.status(404).json({ message: 'Buyer application not found.' });
    }

    return res.json(application);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to load buyer application.' });
  }
});

module.exports = router;
