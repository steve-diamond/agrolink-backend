require('dotenv').config();

const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI is not set in environment variables.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
