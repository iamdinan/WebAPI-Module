const express = require("express");
const { connect } = require("../data");

const router = express.Router();

function toStationDto(station) {
  return {
    station_id: station.id,
    name: station.name,
    district_id: station.district_id,
  };
}

router.get("/", async (req, res) => {
  const db = await connect();
  const stations = await db.collection("stations").find().toArray();
  res.json(stations.map(toStationDto));
});

router.get("/:stationId", async (req, res) => {
  const db = await connect();
  const stationId = Number(req.params.stationId);
  const station = await db.collection("stations").findOne({ id: stationId });

  if (!station) {
    return res.status(404).json({ error: "Station not found" });
  }

  res.json(toStationDto(station));
});

module.exports = router;
