const express = require("express");
const db = require("../data");

const router = express.Router();

function toDistrictDto(district) {
  return {
    district_id: district.id,
    name: district.name,
    province_id: district.province_id,
  };
}

// GET /districts
router.get("/", (req, res) => {
  res.json(db.districts.map(toDistrictDto));
});

// GET /districts/:districtId
router.get("/:districtId", (req, res) => {
  const districtId = Number(req.params.districtId);
  const district = db.districts.find((d) => d.id === districtId);

  if (!district) {
    return res.status(404).json({ error: "District not found" });
  }

  res.json(toDistrictDto(district));
});

module.exports = router;
