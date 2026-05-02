"use strict";

require("dotenv").config();

const { bootstrapAuth } = require("./services/authService");
const { runScheduler } = require("./services/schedulerService");
const { log } = require("./middleware/logger");

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   Vehicle Maintenance Scheduler — CLI Mode  ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  try {
    log("backend", "info", "server", "CLI scheduler invoked");

    await bootstrapAuth();
    const results = await runScheduler();

    if (!results.length) {
      console.log("⚠️  No depots found. Nothing to schedule.");
      return;
    }

    console.log(`\n� Scheduling Results (${results.length} depot(s))\n`);
    console.log("─".repeat(60));

    results.forEach((depot) => {
      console.log(`\n  Depot ID: ${depot.depotId}`);
      console.log(`      Total Duration : ${depot.totalDuration} hours`);
      console.log(`      Total Impact   : ${depot.totalImpact}`);
      console.log(`      Vehicles Assigned (${depot.selectedTasks.length}):`);

      if (!depot.selectedTasks.length) {
        console.log("        — none —");
      } else {
        depot.selectedTasks.forEach((task, idx) => {
          console.log(
            `        ${idx + 1}. Vehicle ${task.vehicleId}  |  ${task.duration}h  |  impact: ${task.impact}`
          );
        });
      }

      if (depot.note) {
        console.log(`    ℹ️  Note: ${depot.note}`);
      }
    });

    console.log("\n" + "─".repeat(60));
    console.log("  Done.\n");

    log("backend", "info", "server", "CLI scheduler finished successfully");
  } catch (err) {
    log("backend", "fatal", "server", `CLI run failed: ${err.message}`);
    console.error("\n Error:", err.message);
    process.exit(1);
  }
}

main();
