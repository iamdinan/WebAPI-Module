const express = require("express");
const db = require("../data");

const router = express.Router();

// GET /districts
router.get("/", (req, res) => {
  res.json(db.districts);
});

// GET /districts/:districtId
router.get("/:districtId", (req, res) => {
  const districtId = Number(req.params.districtId);
  const district = db.districts.find((d) => d.id === districtId);

  if (!district) {
    return res.status(404).json({ error: "District not found" });
  }

  res.json(district);
});

module.exports = router;
