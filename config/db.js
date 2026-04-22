import mongoose from 'mongoose';

let connectionPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables.');
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
      // Connection pool – tune per-worker.
      // Total DB connections = maxPoolSize × number of Node.js workers.
      maxPoolSize: 100,
      minPoolSize: 10,
      // How long a checkout thread waits for a free socket.
      waitQueueTimeoutMS: 10000,
      // Abort socket operations that take too long.
      socketTimeoutMS: 45000,
      // Fail fast on initial server discovery.
      serverSelectionTimeoutMS: 10000,
      // Heartbeat keeps idle connections alive.
      heartbeatFrequencyMS: 10000,
    })
    .then(async (connection) => {
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

export default connectDB;
