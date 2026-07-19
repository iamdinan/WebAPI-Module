const express = require("express");
const { connect } = require("./data");

const provincesRouter = require("./routes/provinces");
const districtsRouter = require("./routes/districts");
const stationsRouter = require("./routes/stations");
const vehiclesRouter = require("./routes/vehicles");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

app.use("/provinces", provincesRouter);
app.use("/districts", districtsRouter);
app.use("/stations", stationsRouter);
app.use("/vehicles", vehiclesRouter);

if (require.main === module) {
  connect()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err);
      process.exit(1);
    });
}

module.exports = app;
