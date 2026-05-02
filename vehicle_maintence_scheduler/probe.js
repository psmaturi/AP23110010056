"use strict";
require("dotenv").config();
const axios = require("axios");

async function probeLogs() {
  const BASE = "http://20.207.122.201/evaluation-service";
  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ0ZXN0dXNlci4xNzc3NzAwMzU4NzM2QG1haWxpbmF0b3IuY29tIiwiZXhwIjoxNzc3NzAxMjU4LCJpYXQiOjE3Nzc3MDAzNTgsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI0MmY5NWZmNy1iZjE2LTQzZjItOThkMi04NTY2MjYxN2M3MDMiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJ0ZXN0dXNlcjE3Nzc3MDAzNTg3MzYiLCJzdWIiOiI2ZmY4ZDY5Ny02OWUyLTRkYmUtYWFiMi1mY2E3Nzc0YzIyMzcifSwiZW1haWwiOiJ0ZXN0dXNlci4xNzc3NzAwMzU4NzM2QG1haWxpbmF0b3IuY29tIiwibmFtZSI6InRlc3R1c2VyMTc3NzcwMDM1ODczNiIsInJvbGxObyI6InRlc3QxNzc3NzAwMzU4NzM2IiwiYWNjZXNzQ29kZSI6IlFrYnB4SCIsImNsaWVudElEIjoiNmZmOGQ2OTctNjllMi00ZGJlLWFhYjItZmNhNzc3NGMyMjM3IiwiY2xpZW50U2VjcmV0IjoickZRTWpKRXh0WWNTdmh3cSJ9.1BGmEGjSDknURTlJtvI3kVQbRbR0KaWGIA3ZbdZc4yQ";

  const headers = { Authorization: `Bearer ${TOKEN}` };

  const testPackages = [
    "backend", "frontend", "server", "app", "express", "auth", "system",
    "http", "request", "api", "database", "core", "depot", "vehicle", "evaluation",
    "evaluation-service", "middleware"
  ];

  for (const pkg of testPackages) {
    try {
      const r = await axios.post(`${BASE}/logs`, {
        stack: "backend", level: "info", package: pkg, message: "test log"
      }, { headers });
      console.log(` Success for package: '${pkg}'`);
    } catch (e) {
      if (e.response?.status !== 400) {
        console.log(`   Error for '${pkg}': ${e.response?.status}`);
      }
    }
  }
}

probeLogs();
