const { MongoClient } = require("mongodb");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
let _db;

async function connect() {
  if (_db) return _db;
  await client.connect();
  _db = client.db();
  await seedIfEmpty();
  return _db;
}

async function seedIfEmpty() {
  const collections = ["provinces", "districts", "stations", "vehicles", "pings"];
  for (const name of collections) {
    const count = await _db.collection(name).countDocuments();
    if (count > 0) continue;
    const seedPath = path.join(__dirname, "seed.json");
    const raw = fs.readFileSync(seedPath, "utf-8");
    const parsed = JSON.parse(raw);
    const docs = parsed[name];
    if (docs && docs.length > 0) {
      await _db.collection(name).insertMany(docs);
    }
  }
}

module.exports = { connect, client };
