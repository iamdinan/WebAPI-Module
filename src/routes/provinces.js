const express = require("express");
const db = require("../data");

const router = express.Router();

function toProvinceDto(province) {
  return {
    province_id: province.id,
    name: province.name,
  };
}

// GET /provinces
router.get("/", (req, res) => {
  res.json(db.provinces.map(toProvinceDto));
});

// GET /provinces/:provinceId
router.get("/:provinceId", (req, res) => {
  const provinceId = Number(req.params.provinceId);
  const province = db.provinces.find((p) => p.id === provinceId);

  if (!province) {
    return res.status(404).json({ error: "Province not found" });
  }

  res.json(toProvinceDto(province));
});

module.exports = router;
