"use strict";

const axios = require("axios");
const config = require("../config/appConfig");

async function httpWithRetry(axiosConfig, maxAttempts = config.retry.maxAttempts) {
  let lastErr;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios(axiosConfig);
      return response;
    } catch (err) {
      const status = err.response?.status;

      if (status && status >= 400 && status < 500) {
        throw err;
      }

      lastErr = err;
      const delayMs = config.retry.baseDelayMs * Math.pow(2, attempt - 1);

      if (attempt < maxAttempts) {
        await sleep(delayMs);
      }
    }
  }

  throw lastErr;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { httpWithRetry };
