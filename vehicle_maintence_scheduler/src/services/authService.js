"use strict";

const { httpWithRetry } = require("../utils/httpClient");
const credStore = require("../utils/credentialStore");
const { log } = require("../middleware/logger");
const config = require("../config/appConfig");

async function registerClient() {
  log("backend", "info", "auth", "Initiating client registration");

  const regPayload = {
    name: config.registration.name,
    email: config.registration.email,
    rollNo: config.registration.rollNo,
    mobileNo: config.registration.mobileNo,
    githubUsername: config.registration.githubUsername,
    accessCode: config.registration.accessCode,
  };

  const response = await httpWithRetry({
    method: "POST",
    url: `${config.baseUrl}${config.endpoints.register}`,
    headers: { "Content-Type": "application/json" },
    data: regPayload,
    timeout: 10000,
  });

  const clientID     = response.data.clientID;
  const clientSecret = response.data.clientSecret;

  if (!clientID || !clientSecret) {
    log("backend", "error", "auth", `Unexpected register response shape: ${JSON.stringify(response.data)}`);
    throw new Error("Registration response missing clientID or clientSecret");
  }

  log("backend", "info", "auth", `Client registered — clientID: ${clientID}`);
  return { clientID, clientSecret, regPayload };
}

async function authenticateClient({ clientID, clientSecret, regPayload }) {
  log("backend", "info", "auth", `Requesting access token for clientID: ${clientID}`);

  const authBody = {
    name: regPayload.name,
    email: regPayload.email,
    rollNo: regPayload.rollNo,
    accessCode: regPayload.accessCode,
    clientID,
    clientSecret,
  };

  const response = await httpWithRetry({
    method: "POST",
    url: `${config.baseUrl}${config.endpoints.auth}`,
    headers: { "Content-Type": "application/json" },
    data: authBody,
    timeout: 10000,
  });

  const accessToken = response.data.access_token;

  if (!accessToken) {
    log("backend", "error", "auth", `Auth response missing access_token: ${JSON.stringify(response.data)}`);
    throw new Error("No access_token returned from auth endpoint");
  }

  log("backend", "info", "auth", "Access token acquired successfully");
  return accessToken;
}

async function bootstrapAuth() {
  try {
    let clientID     = config.registration.clientID;
    let clientSecret = config.registration.clientSecret;
    let regPayload   = {
      name:       config.registration.name,
      email:      config.registration.email,
      rollNo:     config.registration.rollNo,
      accessCode: config.registration.accessCode,
    };

    if (!clientID || !clientSecret) {
      try {
        const reg = await registerClient();
        clientID     = reg.clientID;
        clientSecret = reg.clientSecret;
        regPayload   = reg.regPayload;
      } catch (regErr) {
        const status = regErr.response?.status;
        if (status === 409) {

          log("backend", "warn", "auth", "Registration 409 — falling back to env-stored clientID/clientSecret");
          if (!clientID || !clientSecret) {
            throw new Error(
              "Registration 409 (duplicate identity) and no CLIENT_ID/CLIENT_SECRET found in .env. " +
              "Add CLIENT_ID and CLIENT_SECRET from your first successful registration."
            );
          }
        } else {
          throw regErr;
        }
      }
    } else {
      log("backend", "info", "auth", "Using pre-stored clientID from environment — skipping registration");
    }

    const accessToken = await authenticateClient({ clientID, clientSecret, regPayload });

    credStore.setCredentials({ clientId: clientID, clientSecret, accessToken });
    log("backend", "info", "auth", "Auth bootstrap complete — credentials stored in memory");
  } catch (err) {
    log("backend", "fatal", "auth", `Auth bootstrap failed: ${err.message}`);
    throw err;
  }
}

async function refreshToken() {
  const clientID     = credStore.getClientId();
  const clientSecret = credStore.getClientSecret();

  if (!clientID || !clientSecret) {
    throw new Error("Cannot refresh — no stored credentials. Run bootstrapAuth first.");
  }

  log("backend", "warn", "auth", "Token expired — refreshing");

  const regPayload = {
    name:       config.registration.name,
    email:      config.registration.email,
    rollNo:     config.registration.rollNo,
    accessCode: config.registration.accessCode,
  };

  const freshToken = await authenticateClient({ clientID, clientSecret, regPayload });
  credStore.setCredentials({ clientId: clientID, clientSecret, accessToken: freshToken });

  log("backend", "info", "auth", "Token refreshed successfully");
  return freshToken;
}

module.exports = { bootstrapAuth, refreshToken };
