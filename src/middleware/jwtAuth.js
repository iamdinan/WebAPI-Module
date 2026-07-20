const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "tuk-tuk-secret-key";

const jwtAuth = (req, res, next) => {
  const auth = req.get("Authorization");

  if (!auth) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Authorization header must be Bearer <token>" });
  }

  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = jwtAuth;
