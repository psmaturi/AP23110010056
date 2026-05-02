# Microservices Architecture Assignment

This repository contains two distinct microservice projects developed as part of a comprehensive backend engineering assignment. Both projects focus on scalability, algorithmic efficiency, and production-ready system design.

## 1. Vehicle Maintenance Scheduler (`/vehicle-scheduler`)
A robust Node.js and Express backend service designed to optimize the allocation of vehicle maintenance tasks across multiple depots. 
* **Core Logic**: It implements a dynamic programming **0/1 Knapsack algorithm** to maximize the overall "impact" of maintenance tasks without exceeding the available mechanic hours at each depot.
* **Integrations**: It securely communicates with an external evaluation API, handling automatic registration, dynamic token refreshing, and custom remote logging middleware.

## 2. Campus Notifications System (`/campus-notifications`)
A system design and implementation project focused on handling massive data scale (e.g., 50,000 users and 5M notifications).
* **System Design**: Includes a detailed architectural breakdown covering REST API design, PostgreSQL query optimization (Composite Indexing), Redis caching strategies, and reliable worker-queue (BullMQ) patterns.
* **Stream Processing**: Includes a working Node.js implementation (`stage6.js`) that uses a highly efficient **Priority Min-Heap** algorithm to process and filter continuous notification streams by priority and timestamp in `O(N log K)` time.

Both projects have been thoroughly cleaned, formatted, and optimized for academic submission.
