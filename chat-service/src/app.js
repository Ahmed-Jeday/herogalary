const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { databaseState } = require("./config/db");
const roomRoutes = require("./routes/room.routes");

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "20kb" }));

app.get("/health", (_req, res) => {
  const db = databaseState();
  const healthy = db === "connected";

  return res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    db,
  });
});

app.use("/api/rooms", roomRoutes);

app.use((_req, res) => {
  return res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;

  if (status >= 500) {
    console.error(error);
  }

  return res.status(status).json({
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: status >= 500 ? "Internal server error" : error.message,
    },
  });
});

module.exports = app;
