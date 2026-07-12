const express = require("express");
const db = require("../data");
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

// Returns the most recent ping for a vehicle, or undefined if none exist.
// Sorts a copy so the shared db.pings array is never mutated.
function getLastPing(vehicleId) {
  const vehiclePings = db.pings.filter((p) => p.vehicle_id === vehicleId);

  if (vehiclePings.length === 0) {
    return undefined;
  }

  const sorted = [...vehiclePings].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
  );

  return sorted[0];
}

router.use((req, res, next) => {
  if (req.method === "GET") {
    return basicAuth(req, res, next);
  }
  next();
});

// GET /vehicles
router.get("/", (req, res) => {
  res.json(db.vehicles.map(toVehicleDto));
});

// GET /vehicles/:vehicleId
router.get("/:vehicleId", (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const lastPing = getLastPing(vehicleId);

  res.json({
    ...toVehicleDto(vehicle),
    last_ping: lastPing ? toPingDto(lastPing) : null,
  });
});

// GET /vehicles/:vehicleId/pings
router.get("/:vehicleId/pings", (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const pings = db.pings.filter((p) => p.vehicle_id === vehicleId);
  res.json(pings.map(toPingDto));
});

// POST /vehicles/:vehicleId/pings
router.post("/:vehicleId/pings", validateApiKey, (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const { latitude, longitude, speed } = req.body;

  if (latitude == null || longitude == null || speed == null) {
    return res
      .status(400)
      .json({ error: "latitude, longitude, and speed are required" });
  }

  const id = db.pings.length + 1;
  const timestamp = new Date().toISOString();

  const newPing = { id, vehicle_id: vehicleId, latitude, longitude, speed, timestamp };
  db.pings.push(newPing);

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

// GET /vehicles/:vehicleId/pings/:pingId
router.get("/:vehicleId/pings/:pingId", (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const pingId = Number(req.params.pingId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const ping = db.pings.find((p) => p.id === pingId && p.vehicle_id === vehicleId);

  if (!ping) {
    return res.status(404).json({ error: "Ping not found" });
  }

  res.json(toPingDto(ping));
});

// GET /vehicles/:vehicleId/last-position
router.get("/:vehicleId/last-position", (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const lastPing = getLastPing(vehicleId);

  if (!lastPing) {
    return res
      .status(404)
      .json({ error: "No position found for this vehicle" });
  }

  res.json(toLastPositionDto(lastPing));
});

module.exports = router;
