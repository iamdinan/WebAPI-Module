const db = require("../data");

const deviceKeys = Object.fromEntries(
  db.vehicles.map((v) => [
    "v-" + String(v.id).padStart(2, "0"),
    "key_v" + String(v.id).padStart(2, "0"),
  ]),
);

const validateApiKey = (req, res, next) => {
  const apiKey = req.get("X-API-Key");

  if (!apiKey) {
    return res.status(401).json({ error: "X-API-Key header is required" });
  }

  const vehicleId = Number(req.params.vehicleId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const key = "v-" + String(vehicleId).padStart(2, "0");

  if (deviceKeys[key] !== apiKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};

module.exports = { deviceKeys, validateApiKey };
