const express = require("express");
const { connect } = require("../data");

const router = express.Router();

function toDistrictDto(district) {
  return {
    district_id: district.id,
    name: district.name,
    province_id: district.province_id,
  };
}

router.get("/", async (req, res) => {
  const db = await connect();
  const districts = await db.collection("districts").find().toArray();
  res.json(districts.map(toDistrictDto));
});

router.get("/:districtId", async (req, res) => {
  const db = await connect();
  const districtId = Number(req.params.districtId);
  const district = await db.collection("districts").findOne({ id: districtId });

  if (!district) {
    return res.status(404).json({ error: "District not found" });
  }

  res.json(toDistrictDto(district));
});

module.exports = router;
