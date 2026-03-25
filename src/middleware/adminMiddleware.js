const jwt = require("jsonwebtoken");

const User = require("../models/User");

module.exports = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
