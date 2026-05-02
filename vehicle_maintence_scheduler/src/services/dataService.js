"use strict";

const { httpWithRetry } = require("../utils/httpClient");
const credStore = require("../utils/credentialStore");
const { refreshToken } = require("./authService");
const { log } = require("../middleware/logger");
const config = require("../config/appConfig");

function buildAuthHeader() {
  return { Authorization: `Bearer ${credStore.getToken()}` };
}

async function authenticatedGet(endpoint) {
  try {
    const response = await httpWithRetry({
      method: "GET",
      url: `${config.baseUrl}${endpoint}`,
      headers: { ...buildAuthHeader() },
      timeout: 12000,
    });
    return response.data;
  } catch (err) {
    if (err.response?.status === 401) {
      log("backend", "warn", "handler", `401 on ${endpoint} — refreshing token and retrying`);
      await refreshToken();
      const retryResponse = await httpWithRetry({
        method: "GET",
        url: `${config.baseUrl}${endpoint}`,
        headers: { ...buildAuthHeader() },
        timeout: 12000,
      });
      return retryResponse.data;
    }
    throw err;
  }
}

async function fetchDepots() {
  log("backend", "info", "depot", "Fetching depot list from API");

  const raw = await authenticatedGet(config.endpoints.depots);

  const rawList = Array.isArray(raw) ? raw : raw?.depots ?? [];

  if (!rawList.length) {
    log("backend", "warn", "depot", "Depot API returned an empty list");
    return [];
  }

  const normalized = rawList
    .filter((d) => {
      const ok = d && (d.ID !== undefined) && typeof d.MechanicHours === "number";
      if (!ok) log("backend", "warn", "depot", `Skipping malformed depot: ${JSON.stringify(d)}`);
      return ok;
    })
    .map((d) => ({
      id: d.ID,
      available_hours: d.MechanicHours,
    }));

  log("backend", "info", "depot", `Fetched ${normalized.length} valid depot(s)`);
  return normalized;
}

async function fetchVehicles() {
  log("backend", "info", "vehicle", "Fetching vehicle list from API");

  const raw = await authenticatedGet(config.endpoints.vehicles);

  const rawList = Array.isArray(raw) ? raw : raw?.vehicles ?? [];

  if (!rawList.length) {
    log("backend", "warn", "vehicle", "Vehicle API returned an empty list");
    return [];
  }

  const normalized = rawList
    .filter((v) => {
      const ok =
        v &&
        v.TaskID !== undefined &&
        typeof v.Duration === "number" &&
        v.Duration > 0 &&
        typeof v.Impact === "number";
      if (!ok) log("backend", "warn", "vehicle", `Skipping malformed vehicle: ${JSON.stringify(v)}`);
      return ok;
    })
    .map((v) => ({
      id: v.TaskID,
      duration: v.Duration,
      impact: v.Impact,
    }));

  log("backend", "info", "vehicle", `Fetched ${normalized.length} valid vehicle(s)`);
  return normalized;
}

module.exports = { fetchDepots, fetchVehicles };
