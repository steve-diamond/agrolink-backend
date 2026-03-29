const Subscription = require('../../models/Subscription');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const axios = require('axios');

const SUBSCRIPTION_FEE = 2000; // NGN, example monthly fee
const SUBSCRIPTION_DURATION_DAYS = 30;

// 1. Initialize subscription payment (Paystack)
exports.initializeSubscription = asyncHandler(async (req, res) => {
  const { email, callback_url } = req.body;
  if (!email || !callback_url) {
    throw new ApiError(400, 'email and callback_url are required');
  }
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) throw new ApiError(500, 'Paystack secret not configured');
  const paystackRes = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email,
      amount: SUBSCRIPTION_FEE * 100,
      callback_url,
      metadata: { type: 'subscription', userId: req.user._id },
    },
    {
      headers: { Authorization: `Bearer ${paystackSecret}` },
      timeout: 15000,
    }
  );
  const data = paystackRes.data?.data || {};
  res.status(200).json({
    status: 'success',
    authorization_url: data.authorization_url,
    reference: data.reference,
    access_code: data.access_code,
    data,
  });
});

// 2. Verify subscription payment
exports.verifySubscription = asyncHandler(async (req, res) => {
  const reference = req.params.reference || req.body.reference || req.query.reference;
  if (!reference) throw new ApiError(400, 'reference is required');
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecret) throw new ApiError(500, 'Paystack secret not configured');
  const paystackRes = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${paystackSecret}` }, timeout: 15000 }
  );
  const tx = paystackRes.data?.data || {};
  if (tx.status !== 'success') {
    return res.status(400).json({ status: 'failed', message: 'Payment not successful', data: tx });
  }
  // Upsert subscription
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  await Subscription.findOneAndUpdate(
    { user: req.user._id },
    {
      status: 'active',
      startDate,
      endDate,
      paymentReference: reference,
    },
    { upsert: true, new: true }
  );
  res.status(200).json({ status: 'success', message: 'Subscription activated', data: tx });
});

// 3. Get current user's subscription status
exports.getMySubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findOne({ user: req.user._id });
  res.status(200).json({ status: 'success', data: sub });
});
