"use strict";

const { fetchDepots, fetchVehicles } = require("./dataService");
const { solveKnapsack } = require("../utils/knapsack");
const { log } = require("../middleware/logger");

async function runScheduler() {
  log("backend", "info", "scheduler", "Scheduler pipeline started");

  let depots, vehicles;
  try {
    [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);
  } catch (err) {
    log("backend", "error", "scheduler", `Failed to fetch API data: ${err.message}`);
    throw new Error(`Data fetch failed: ${err.message}`);
  }

  if (!depots.length) {
    log("backend", "warn", "scheduler", "No depots available — nothing to schedule");
    return [];
  }

  if (!vehicles.length) {
    log("backend", "warn", "scheduler", "No vehicles available — all depots will have empty allocations");
  }

  log(
    "backend",
    "info",
    "scheduler",
    `Running knapsack for ${depots.length} depot(s) against ${vehicles.length} vehicle(s)`
  );

  const allResults = depots.map((depot) => {
    const depotId = depot.id;
    const availableHours = depot.available_hours ?? depot.availableHours ?? 0;

    if (availableHours <= 0) {
      log("backend", "warn", "scheduler", `Depot ${depotId} has 0 available hours — skipping`);
      return {
        depotId,
        selectedTasks: [],
        totalDuration: 0,
        totalImpact: 0,
        note: "Depot had zero available mechanic hours",
      };
    }

    log(
      "backend",
      "debug",
      "scheduler",
      `Knapsack for depot ${depotId}: capacity=${availableHours}h, candidates=${vehicles.length}`
    );

    const { selectedItems, totalDuration, totalImpact } = solveKnapsack(vehicles, availableHours);

    log(
      "backend",
      "info",
      "scheduler",
      `Depot ${depotId}: selected ${selectedItems.length} vehicle(s), impact=${totalImpact}, hours=${totalDuration}`
    );

    return {
      depotId,
      selectedTasks: selectedItems.map((v) => ({
        vehicleId: v.id,
        duration: v.duration,
        impact: v.impact,
        ...(v.name ? { name: v.name } : {}),
      })),
      totalDuration,
      totalImpact,
    };
  });

  log("backend", "info", "scheduler", `Scheduling complete — ${allResults.length} depot result(s) produced`);
  return allResults;
}

module.exports = { runScheduler };
