// scripts/predeploy-check.js
require('dotenv').config();
const mongoose = require('mongoose');
const { execSync } = require('child_process');

// List all required environment variables
const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CORS_ORIGIN',
  'PAYSTACK_SECRET_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  // Optional but recommended
  'ADMIN_NAME',
  'SMS_API_URL',
  'SMS_API_KEY',
  'SMS_SENDER',
  'EMAIL_FROM',
  'SMTP_URL',
  'API_BASE_URL',
  'PAYMENT_CALLBACK_URL',
  'NEXT_PUBLIC_API_URL',
  'EXPO_PUBLIC_API_URL',
  'SUBSCRIPTION_FEE',
];

let missing = [];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) missing.push(key);
}

if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// MongoDB connectivity check
const mongoUri = process.env.MONGO_URI;
console.log('Checking MongoDB connectivity...');
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('MongoDB Connected');
    mongoose.connection.close();
    // Run npm audit
    try {
      console.log('Running npm audit...');
      execSync('npm audit --audit-level=high', { stdio: 'inherit' });
    } catch (err) {
      console.error('npm audit found vulnerabilities. Please review above.');
      process.exit(1);
    }
    // Run npm run lint if available
    try {
      console.log('Running npm run lint...');
      execSync('npm run lint', { stdio: 'inherit' });
    } catch (err) {
      console.warn('Linting failed or not configured.');
    }
    console.log('Predeploy checks passed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
