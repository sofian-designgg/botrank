const mongoose = require("mongoose");

async function connectMongo(mongoUrl) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUrl);
}

module.exports = { connectMongo };
