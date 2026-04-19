const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(payload.id).select("_id role username email");
    if (!user) {
      return res.status(401).json({ message: "Invalid token user" });
    }
    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  return next();
};

module.exports = { requireAuth, requireRole };
