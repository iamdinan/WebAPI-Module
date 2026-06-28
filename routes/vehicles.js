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

  res.json(toVehicleDto(vehicle));
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
