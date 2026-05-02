"use strict";

const express = require("express");
const { scheduleAll, healthCheck } = require("../controllers/scheduleController");

const router = express.Router();

router.get("/health", healthCheck);

router.get("/schedule", scheduleAll);

module.exports = router;
