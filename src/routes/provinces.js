const express = require("express");
const { connect } = require("../data");

const router = express.Router();

function toProvinceDto(province) {
  return {
    province_id: province.id,
    name: province.name,
  };
}

router.get("/", async (req, res) => {
  const db = await connect();
  const provinces = await db.collection("provinces").find().toArray();
  res.json(provinces.map(toProvinceDto));
});

router.get("/:provinceId", async (req, res) => {
  const db = await connect();
  const provinceId = Number(req.params.provinceId);
  const province = await db.collection("provinces").findOne({ id: provinceId });

  if (!province) {
    return res.status(404).json({ error: "Province not found" });
  }

  res.json(toProvinceDto(province));
});

module.exports = router;
