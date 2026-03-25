require('dotenv').config();

const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed.',
    });
  }

  return app(req, res);
};