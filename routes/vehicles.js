const express = require("express");
const db = require("../data");

const router = express.Router();

// GET /vehicles
router.get("/", (req, res) => {
  res.json(db.vehicles);
});

// GET /vehicles/:vehicleId
router.get("/:vehicleId", (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  res.json(vehicle);
});

// GET /vehicles/:vehicleId/pings
router.get("/:vehicleId/pings", (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  const vehicle = db.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return res.status(404).json({ error: "Vehicle not found" });
  }

  const pings = db.pings.filter((p) => p.vehicle_id === vehicleId);
  res.json(pings);
});

module.exports = router;
