"use strict";

const { httpWithRetry } = require("../utils/httpClient");
const credStore = require("../utils/credentialStore");
const config = require("../config/appConfig");

const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_STACKS = new Set(["backend", "frontend"]);

const BACKEND_PACKAGES = new Set([
  "server", "auth", "handler", "scheduler", "knapsack",
  "depot", "vehicle", "middleware", "config", "db",
]);
const FRONTEND_PACKAGES = new Set([
  "ui", "store", "router", "api", "component", "hook", "util",
]);

async function log(stack, level, pkg, message) {

  if (!VALID_STACKS.has(stack) || !VALID_LEVELS.has(level)) {
    console.error(`[logger] Dropped invalid log: stack=${stack}, level=${level}`);
    return;
  }

  const allowedPackages = stack === "backend" ? BACKEND_PACKAGES : FRONTEND_PACKAGES;
  if (!allowedPackages.has(pkg)) {
    console.error(`[logger] Unknown package '${pkg}' for stack '${stack}', skipping`);
    return;
  }

  const prefix = `[${stack.toUpperCase()}][${level.toUpperCase()}][${pkg}]`;
  console.log(`${prefix} ${message}`);

  let apiPackage = "middleware";
  if (pkg === "auth") apiPackage = "auth";

  try {
    const token = credStore.getToken();

    await httpWithRetry({
      method: "POST",
      url: `${config.baseUrl}${config.endpoints.logs}`,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      data: { stack, level, package: apiPackage, message },
      timeout: 5000,
    });
  } catch (err) {

    console.error(`[logger] Remote log delivery failed: ${err.message}`);
  }
}

module.exports = { log };
