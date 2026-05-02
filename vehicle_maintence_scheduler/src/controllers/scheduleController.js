"use strict";

const { runScheduler } = require("../services/schedulerService");
const { log } = require("../middleware/logger");

async function scheduleAll(req, res) {
  log("backend", "info", "handler", "Received request: GET /api/schedule");

  try {
    const results = await runScheduler();

    const summary = {
      generatedAt: new Date().toISOString(),
      totalDepots: results.length,
      totalVehiclesScheduled: results.reduce((n, r) => n + r.selectedTasks.length, 0),
      allocations: results,
    };

    log("backend", "info", "handler", `Schedule response ready: ${results.length} depot(s)`);
    return res.status(200).json(summary);
  } catch (err) {
    log("backend", "error", "handler", `Schedule endpoint error: ${err.message}`);
    return res.status(500).json({
      error: "Scheduling failed",
      detail: err.message,
    });
  }
}

async function healthCheck(req, res) {
  return res.status(200).json({
    status: "ok",
    service: "vehicle-maintenance-scheduler",
    timestamp: new Date().toISOString(),
  });
}

module.exports = { scheduleAll, healthCheck };
