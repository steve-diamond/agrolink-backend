require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const ensureAdminUser = require('./utils/ensureAdminUser');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    await ensureAdminUser();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed. Server not started:', err.message);
    process.exit(1);
  });