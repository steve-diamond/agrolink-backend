require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const ensureAdminUser = require('./src/utils/ensureAdminUser');

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