require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "20kb" }));

app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    for (const part of cookieHeader.split(";")) {
      const separator = part.indexOf("=");
      if (separator !== -1) {
        const name = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        req.cookies[name] = decodeURIComponent(value);
      }
    }
  }
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.status ? error.message : "Internal server error",
    },
  });
});

module.exports = app;