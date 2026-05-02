"use strict";

require("dotenv").config();

const express = require("express");
const { bootstrapAuth } = require("./services/authService");
const { log } = require("./middleware/logger");
const scheduleRoutes = require("./routes/scheduleRoutes");
const config = require("./config/appConfig");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - startedAt;
    log(
      "backend",
      "info",
      "server",
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`
    );
  });
  next();
});

app.use("/api", scheduleRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  log("backend", "error", "server", `Unhandled exception: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

async function startServer() {
  try {

    await bootstrapAuth();

    app.listen(config.port, () => {
      log("backend", "info", "server", `Vehicle scheduler listening on port ${config.port}`);
      console.log(`\n    Server running at http://localhost:${config.port}/api/schedule\n`);
    });
  } catch (err) {
    log("backend", "fatal", "server", `Startup failed: ${err.message}`);
    console.error("Fatal: could not start server —", err.message);
    process.exit(1);
  }
}

startServer();
