const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/heroverse_shop";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
