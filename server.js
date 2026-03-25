require('dotenv').config();
const cors = require('cors');

const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: '*', // later restrict to your frontend domain
  })
);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed. Server not started:', err.message);
    process.exit(1);
  });