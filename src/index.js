const express = require("express");

// Loading this module reads and parses seed.json once at startup.
require("./data");

const provincesRouter = require("./routes/provinces");
const districtsRouter = require("./routes/districts");
const stationsRouter = require("./routes/stations");
const vehiclesRouter = require("./routes/vehicles");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

app.use("/provinces", provincesRouter);
app.use("/districts", districtsRouter);
app.use("/stations", stationsRouter);
app.use("/vehicles", vehiclesRouter);

// Only listen when run directly (local dev). Vercel imports the app instead.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
