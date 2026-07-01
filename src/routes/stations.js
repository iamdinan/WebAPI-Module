const express = require("express");
const db = require("../data");

const router = express.Router();

function toStationDto(station) {
  return {
    station_id: station.id,
    name: station.name,
    district_id: station.district_id,
  };
}

// GET /stations
router.get("/", (req, res) => {
  res.json(db.stations.map(toStationDto));
});

// GET /stations/:stationId
router.get("/:stationId", (req, res) => {
  const stationId = Number(req.params.stationId);
  const station = db.stations.find((s) => s.id === stationId);

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  res.json(toStationDto(station));
});

module.exports = router;
