const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in environment variables.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set('strictQuery', true);
  
  connectionPromise = mongoose
    .connect(mongoUri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
    })
    .then(async (connection) => {
      // Validate connection with ping
      await mongoose.connection.db.admin().command({ ping: 1 });
      console.log(`✓ MongoDB connected: ${mongoose.connection.host}`);
      return connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error('MongoDB connection error:', error.message);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
