const fs = require("fs");
const path = require("path");

const seedPath = path.join(__dirname, "seed.json");

let raw;
try {
  raw = fs.readFileSync(seedPath, "utf-8");
} catch (err) {
  throw new Error(`Could not read seed.json at ${seedPath}: ${err.message}`);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  throw new Error(`seed.json contains invalid JSON: ${err.message}`);
}

// In-memory collections, loaded once at process startup.
const db = {
  provinces: parsed.provinces || [],
  districts: parsed.districts || [],
  stations: parsed.stations || [],
  vehicles: parsed.vehicles || [],
  pings: parsed.pings || [],
};

module.exports = db;
