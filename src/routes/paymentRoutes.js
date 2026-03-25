const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");

// Initialize Payment
router.post("/initialize", async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: "PAYSTACK_SECRET_KEY is not configured" });
    }

    const { email, amount, orderId, callback_url } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses kobo
        callback_url,
        metadata: {
          orderId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.code ||
      error.message ||
      "Payment initialization failed";

    console.error("Payment initialize error:", {
      status,
      message,
      upstream: error.response?.data || null,
    });

    res.status(status).json({ error: message });
  }
});

// Verify Payment
router.get("/verify/:reference", async (req, res) => {
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: "PAYSTACK_SECRET_KEY is not configured" });
    }

    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
        timeout: 15000,
      }
    );

    const data = response.data.data;

    if (data.status === "success") {
      const orderId = data?.metadata?.orderId;

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          status: "paid",
        });
      }
    }

    res.json(data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.code ||
      error.message ||
      "Payment verification failed";

    console.error("Payment verify error:", {
      status,
      message,
      reference: req.params.reference,
      upstream: error.response?.data || null,
    });

    res.status(status).json({ error: message });
  }
});

module.exports = router;
