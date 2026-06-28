const express = require("express");
const db = require("../data");

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

module.exports = router;
