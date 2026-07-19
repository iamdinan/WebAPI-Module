const { connect } = require("../data");

async function buildDeviceKeys() {
  const db = await connect();
  const vehicles = await db.collection("vehicles").find().toArray();
  return Object.fromEntries(
    vehicles.map((v) => [
      "v-" + String(v.id).padStart(2, "0"),
      "key_v" + String(v.id).padStart(2, "0"),
    ]),
  );
}

const validateApiKey = async (req, res, next) => {
  const apiKey = req.get("X-API-Key");

  if (!apiKey) {
    return res.status(401).json({ error: "X-API-Key header is required" });
  }

  const db = await connect();
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = await db.collection("vehicles").findOne({ id: vehicleId });

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const deviceKeys = await buildDeviceKeys();
  const key = "v-" + String(vehicleId).padStart(2, "0");

  if (deviceKeys[key] !== apiKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};

module.exports = { validateApiKey };
