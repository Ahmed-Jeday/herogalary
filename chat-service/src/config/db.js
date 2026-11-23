const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

mongoose.connection.on("error", (error) => {
  console.error("MongoDB error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });

  console.log(`MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

function databaseState() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
}

module.exports = { connectDatabase, disconnectDatabase, databaseState };
