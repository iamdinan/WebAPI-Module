const basicAuth = (req, res, next) => {
  const auth = req.get("Authorization");

  if (!auth) {
    res.set("WWW-Authenticate", 'Basic realm="Police API"');
    return res.status(401).json({ error: "Authorization header required" });
  }

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Basic") {
    res.set("WWW-Authenticate", 'Basic realm="Police API"');
    return res.status(401).json({ error: "Invalid Authorization header format" });
  }

  let decoded;
  try {
    decoded = Buffer.from(parts[1], "base64").toString("utf-8");
  } catch {
    res.set("WWW-Authenticate", 'Basic realm="Police API"');
    return res.status(401).json({ error: "Invalid Base64 encoding" });
  }

  const colon = decoded.indexOf(":");
  const username = colon !== -1 ? decoded.slice(0, colon) : decoded;
  const password = colon !== -1 ? decoded.slice(colon + 1) : "";

  if (username !== "police" || password !== "nibm2024") {
    return res.status(403).json({ error: "Invalid credentials" });
  }

  next();
};

module.exports = basicAuth;
