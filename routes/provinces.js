const express = require("express");
const db = require("../data");

const router = express.Router();

// GET /provinces
router.get("/", (req, res) => {
  res.json(db.provinces);
});

// GET /provinces/:provinceId
router.get("/:provinceId", (req, res) => {
  const provinceId = Number(req.params.provinceId);
  const province = db.provinces.find((p) => p.id === provinceId);

  if (!province) {
    return res.status(404).json({ error: "Province not found" });
  }

  res.json(province);
});

module.exports = router;
