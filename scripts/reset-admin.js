/* eslint-disable no-console */
require("dotenv").config();

const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const mongoose = require("mongoose");

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment.");
    console.error("Example:");
    console.error("  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=StrongPass123 npm run admin:reset");
    process.exit(1);
  }

  await connectDB();

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    user = new User({
      name,
      email,
      password,
      role: "admin",
      approved: true,
    });
    await user.save();
    console.log(`Created admin user: ${email}`);
  } else {
    user.name = user.name || name;
    user.password = password;
    user.role = "admin";
    user.approved = true;
    await user.save();
    console.log(`Reset admin password and role: ${email}`);
  }

  await mongoose.connection.close();
  console.log("Done.");
}

run().catch(async (error) => {
  console.error("Failed to reset/create admin:", error.message);
  try {
    await mongoose.connection.close();
  } catch (_) {
    // ignore close errors
  }
  process.exit(1);
});
