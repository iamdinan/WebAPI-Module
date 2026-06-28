const express = require("express");
const db = require("../data");

const router = express.Router();

// GET /stations
router.get("/", (req, res) => {
  res.json(db.stations);
});

// GET /stations/:stationId
router.get("/:stationId", (req, res) => {
  const stationId = Number(req.params.stationId);
  const station = db.stations.find((s) => s.id === stationId);

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  res.json(station);
});

module.exports = router;
