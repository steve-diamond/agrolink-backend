const axios = require("axios");

const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const toTwoDp = (value) => Number(Number(value || 0).toFixed(2));

const getPaystackSecret = () => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new ApiError(500, "PAYSTACK_SECRET_KEY is not configured");
  }
  return secret;
};

const initializePayment = asyncHandler(async (req, res) => {
  const paystackSecret = getPaystackSecret();
  const { email, amount, orderId, callback_url } = req.body;

  if (!email || amount === undefined || amount === null || !orderId || !callback_url) {
    throw new ApiError(400, "email, amount, orderId, and callback_url are required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order has already been paid");
  }

  const requestedAmount = toTwoDp(amount);
  const orderAmount = toTwoDp(order.totalAmount);

  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new ApiError(400, "amount must be a valid positive number");
  }

  if (requestedAmount !== orderAmount) {
    throw new ApiError(400, "Amount does not match order total", {
      expectedAmount: orderAmount,
    });
  }

  let paystackResponse;
  try {
    paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(requestedAmount * 100),
        callback_url,
        metadata: { orderId },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
  } catch (error) {
    const statusCode = error.response?.status || 502;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.code ||
      error.message ||
      "Payment initialization failed";

    throw new ApiError(statusCode, message, {
      upstream: error.response?.data || null,
    });
  }

  const paystackData = paystackResponse.data?.data || {};
  const reference = paystackData.reference;

  if (reference) {
    order.paymentReference = reference;
    await order.save();
  }

  return res.status(200).json({
    status: "success",
    authorization_url: paystackData.authorization_url,
    reference,
    access_code: paystackData.access_code,
    data: paystackData,
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const paystackSecret = getPaystackSecret();
  const reference = req.params.reference || req.body.reference || req.query.reference;

  if (!reference) {
    throw new ApiError(400, "reference is required");
  }

  let paystackResponse;
  try {
    paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
        timeout: 15000,
      }
    );
  } catch (error) {
    const statusCode = error.response?.status || 502;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.code ||
      error.message ||
      "Payment verification failed";

    throw new ApiError(statusCode, message, {
      upstream: error.response?.data || null,
    });
  }

  const transaction = paystackResponse.data?.data || {};
  const isSuccessful = transaction.status === "success";

  if (isSuccessful) {
    const orderIdFromMeta = transaction?.metadata?.orderId;
    const transactionReference = transaction.reference || reference;

    let order = null;
    if (orderIdFromMeta) {
      order = await Order.findById(orderIdFromMeta);
    }

    if (!order && transactionReference) {
      order = await Order.findOne({ paymentReference: transactionReference });
    }

    if (!order) {
      throw new ApiError(404, "Order not found for this payment reference");
    }

    const paidAmount = toTwoDp((transaction.amount || 0) / 100);
    const orderAmount = toTwoDp(order.totalAmount);

    if (paidAmount !== orderAmount) {
      throw new ApiError(400, "Paid amount does not match order total", {
        paidAmount,
        expectedAmount: orderAmount,
      });
    }

    order.paymentStatus = "paid";
    order.status = "paid";
    order.paymentReference = transactionReference;
    await order.save();

    transaction.orderId = order._id;
  }

  return res.status(200).json({
    status: isSuccessful ? "success" : "failed",
    message: isSuccessful ? "Payment verified successfully" : "Payment not successful",
    data: transaction,
  });
});

module.exports = {
  initializePayment,
  verifyPayment,
};
