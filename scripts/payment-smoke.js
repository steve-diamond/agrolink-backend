/* eslint-disable no-console */
const axios = require("axios");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";
const CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL || "http://localhost:3000/payment-success";

async function main() {
  console.log(`Using API base URL: ${API_BASE_URL}`);

  const health = await axios.get(`${API_BASE_URL}/health`);
  console.log(`health: ${health.status}`);

  const initializePayload = {
    email: "test@example.com",
    amount: 1000,
    orderId: "507f1f77bcf86cd799439011",
    callback_url: CALLBACK_URL,
  };

  let initRes;
  try {
    initRes = await axios.post(`${API_BASE_URL}/api/payment/initialize`, initializePayload);
  } catch (error) {
    const status = error.response?.status || "ERR";
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message;
    throw new Error(`initialize failed (${status}): ${message}`);
  }

  console.log(`initialize: ${initRes.status}`);

  const reference = initRes.data?.data?.reference;
  if (!reference) {
    throw new Error("Initialize did not return a payment reference");
  }

  console.log(`reference: ${reference}`);

  try {
    const verifyRes = await axios.get(`${API_BASE_URL}/api/payment/verify/${reference}`);
    console.log(`verify: ${verifyRes.status}`);
    console.log(`verify.status: ${verifyRes.data?.status || "unknown"}`);
  } catch (error) {
    const status = error.response?.status || "ERR";
    const message = error.response?.data?.error || error.message;
    console.log(`verify: ${status}`);
    console.log(`verify.error: ${message}`);
  }
}

main()
  .then(() => {
    console.log("payment smoke test complete");
  })
  .catch((error) => {
    console.error(`payment smoke test failed: ${error.message}`);
    process.exit(1);
  });
