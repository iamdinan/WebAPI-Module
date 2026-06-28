const express = require("express");

// Loading this module reads and parses seed.json once at startup.
require("./data");

const provincesRouter = require("./routes/provinces");
const districtsRouter = require("./routes/districts");
const stationsRouter = require("./routes/stations");
const vehiclesRouter = require("./routes/vehicles");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/provinces", provincesRouter);
app.use("/districts", districtsRouter);
app.use("/stations", stationsRouter);
app.use("/vehicles", vehiclesRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
