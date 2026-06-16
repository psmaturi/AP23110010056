# Backend Systems Portfolio

This repository contains two backend engineering projects focused on scalable system design, algorithmic optimization, and production-ready service architecture. The projects demonstrate expertise in Node.js, distributed systems, API integrations, database optimization, caching strategies, and efficient algorithm design.

---

# 1. Vehicle Maintenance Scheduler (`/vehicle-scheduler`)

A backend service built with **Node.js** and **Express.js** that optimizes vehicle maintenance planning across multiple depots by efficiently allocating available mechanic hours to high-impact maintenance tasks.

## Key Features

### Maintenance Task Optimization

- Uses a Dynamic Programming implementation of the **0/1 Knapsack Algorithm** to maximize maintenance impact within limited mechanic-hour constraints.
- Generates optimal task schedules for individual depots.

### External API Integration

- Secure integration with third-party services.
- Automatic authentication handling with token refresh mechanisms.
- Resilient API communication and error handling.

### Custom Logging Infrastructure

- Remote logging middleware for centralized monitoring.
- Request tracking and operational visibility.

### Production-Oriented Design

- Modular architecture.
- Environment-based configuration management.
- Scalable service structure suitable for future expansion.

## Technologies

- Node.js
- Express.js
- Dynamic Programming
- REST APIs
- Middleware Architecture
- Authentication & Token Management

## Highlights

- Algorithmic optimization using dynamic programming.
- Efficient resource allocation under real-world constraints.
- Robust external service integration patterns.

---

# 2. Campus Notifications System (`/campus-notifications`)

A scalable notification platform designed to handle large-scale user bases and high notification throughput while maintaining performance and reliability.

## Key Features

### Scalable System Architecture

Designed for environments with:

- 50,000+ active users
- Millions of notification records
- High concurrent traffic

### REST API Design

- Notification creation and delivery endpoints
- User notification retrieval
- Filtering and pagination support
- Scalable API structure

### Database Optimization

- PostgreSQL schema design optimized for notification workloads
- Composite indexing strategies for fast lookups
- Query performance optimization for large datasets

### Caching Layer

- Redis-based caching for:
  - Frequently accessed notifications
  - User-specific notification feeds
  - Reduced database load

### Reliable Background Processing

- BullMQ worker queues
- Asynchronous notification delivery
- Retry mechanisms and fault tolerance
- Event-driven processing patterns

### Stream Processing Engine

Includes a high-performance stream processing implementation (`stage6.js`) that:

- Continuously processes notification streams
- Maintains top-priority notifications
- Uses a **Priority Min-Heap** data structure
- Achieves **O(N log K)** complexity for efficient filtering and ranking

## Technologies

- Node.js
- PostgreSQL
- Redis
- BullMQ
- Priority Queues / Heaps
- REST APIs

## Highlights

- Large-scale system design considerations.
- Database and caching optimization strategies.
- Efficient stream processing algorithms.
- Reliable asynchronous processing architecture.

---

# Engineering Focus Areas

Across these projects, the primary areas of focus include:

- Backend System Design
- Scalable Architecture
- Algorithm Design & Optimization
- API Development
- Database Performance Tuning
- Distributed Processing
- Caching Strategies
- Queue-Based Workflows
- Production-Ready Service Patterns

---

# Repository Structure

```text
.
├── vehicle-scheduler/
│   ├── src/
│   ├── routes/
│   ├── services/
│   └── README.md
│
├── campus-notifications/
│   ├── system-design/
│   ├── implementation/
│   ├── stage6.js
│   └── README.md
│
└── README.md
```

---

## What This Repository Demonstrates

- Building scalable backend systems with Node.js.
- Applying algorithmic problem-solving to real-world business challenges.
- Designing reliable distributed architectures.
- Optimizing databases and caching layers for performance.
- Implementing efficient data processing pipelines.
- Following production-oriented engineering practices.

This repository showcases practical backend engineering solutions combining **algorithmic problem-solving**, **system scalability**, and **production-ready software design**.
