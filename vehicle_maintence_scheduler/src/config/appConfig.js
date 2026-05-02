"use strict";

require("dotenv").config();

module.exports = {
  baseUrl: process.env.BASE_URL || "http://20.207.122.201/evaluation-service",
  port: parseInt(process.env.PORT, 10) || 3000,

  endpoints: {
    register: "/register",
    auth: "/auth",
    logs: "/logs",
    depots: "/depots",
    vehicles: "/vehicles",
  },

  retry: {
    maxAttempts: 3,
    baseDelayMs: 800,
  },

  registration: {
    name: process.env.REG_NAME || "",
    email: process.env.REG_EMAIL || "",
    rollNo: process.env.REG_ROLL_NO || "",
    mobileNo: process.env.REG_MOBILE || "",
    githubUsername: process.env.REG_GITHUB || "",
    accessCode: process.env.REG_ACCESS_CODE || "",

    clientID: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
  },
};
