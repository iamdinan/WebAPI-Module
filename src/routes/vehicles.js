const express = require("express");
const { connect } = require("../data");
const basicAuth = require("../middleware/basicAuth");
const { validateApiKey } = require("../middleware/deviceApiKey");

const router = express.Router();

function toVehicleDto(vehicle) {
  return {
    vehicle_id: vehicle.id,
    reg_number: vehicle.registration_number,
    device_id: vehicle.device_id,
    station_id: vehicle.station_id,
  };
}

function toPingDto(ping) {
  return {
    ping_id: ping.id,
    vehicle_id: ping.vehicle_id,
    timestamp: ping.timestamp,
    lat: ping.latitude,
    lng: ping.longitude,
  };
}

function toLastPositionDto(ping) {
  return {
    vehicle_id: ping.vehicle_id,
    timestamp: ping.timestamp,
    lat: ping.latitude,
    lng: ping.longitude,
  };
}

async function getLastPing(vehicleId) {
  const db = await connect();
  const pings = await db
    .collection("pings")
    .find({ vehicle_id: vehicleId })
    .sort({ timestamp: -1 })
    .limit(1)
    .toArray();
  return pings[0];
}

router.use((req, res, next) => {
  if (req.method === "GET") {
    return basicAuth(req, res, next);
  }
  next();
});

router.get("/", async (req, res) => {
  const db = await connect();
  const vehicles = await db.collection("vehicles").find().toArray();
  res.json(vehicles.map(toVehicleDto));
});

router.get("/:vehicleId", async (req, res) => {
  const db = await connect();
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = await db.collection("vehicles").findOne({ id: vehicleId });

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const lastPing = await getLastPing(vehicleId);

  res.json({
    ...toVehicleDto(vehicle),
    last_ping: lastPing ? toPingDto(lastPing) : null,
  });
});

router.get("/:vehicleId/pings", async (req, res) => {
  const db = await connect();
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = await db.collection("vehicles").findOne({ id: vehicleId });

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const pings = await db
    .collection("pings")
    .find({ vehicle_id: vehicleId })
    .toArray();
  res.json(pings.map(toPingDto));
});

router.post("/:vehicleId/pings", validateApiKey, async (req, res) => {
  const db = await connect();
  const vehicleId = Number(req.params.vehicleId);
  const { latitude, longitude } = req.body;

  if (latitude == null || longitude == null) {
    return res
      .status(400)
      .json({ error: "latitude and longitude are required" });
  }

  const maxPing = await db
    .collection("pings")
    .find()
    .sort({ id: -1 })
    .limit(1)
    .toArray();
  const id = maxPing.length > 0 ? maxPing[0].id + 1 : 1;
  const timestamp = new Date().toISOString();

  const newPing = { id, vehicle_id: vehicleId, latitude, longitude, timestamp };
  await db.collection("pings").insertOne(newPing);

  const location = `/vehicles/${vehicleId}/pings/${id}`;
  const lastModified = new Date(timestamp).toUTCString();
  const etag = `"${id}-${timestamp}"`;

  res
    .status(201)
    .location(location)
    .set("ETag", etag)
    .set("Last-Modified", lastModified)
    .json(toPingDto(newPing));
});

router.get("/:vehicleId/pings/:pingId", async (req, res) => {
  const db = await connect();
  const vehicleId = Number(req.params.vehicleId);
  const pingId = Number(req.params.pingId);
  const vehicle = await db.collection("vehicles").findOne({ id: vehicleId });

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const ping = await db
    .collection("pings")
    .findOne({ id: pingId, vehicle_id: vehicleId });

  if (!ping) {
    return res.status(404).json({ error: "Ping not found" });
  }

  res.json(toPingDto(ping));
});

router.get("/:vehicleId/last-position", async (req, res) => {
  const db = await connect();
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = await db.collection("vehicles").findOne({ id: vehicleId });

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const lastPing = await getLastPing(vehicleId);

  if (!lastPing) {
    return res
      .status(404)
      .json({ error: "No position found for this vehicle" });
  }

  res.json(toLastPositionDto(lastPing));
});

module.exports = router;
