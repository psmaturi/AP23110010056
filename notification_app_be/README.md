# Campus Notifications System

This project contains a comprehensive backend system design and algorithmic implementation for a highly scalable campus notification microservice.

## Assignment Overview & Implementation Details

This folder addresses all 6 stages of the assignment, focusing on system design, database optimization, scalability, and memory-efficient stream processing.

### 1. System Architecture & Design (Stages 1-5)
The detailed architectural decisions are documented in the `Notification_System_Design.md` file. Key accomplishments include:
* **API Design**: Defined clean, scalable REST endpoints and designed a real-time push delivery architecture using **WebSockets** and Redis Pub/Sub.
* **Database Optimization (PostgreSQL)**: Designed a decoupled "Inbox" schema to prevent table bloat. Resolved the `Filesort` performance bottleneck by proposing a precise **Composite Index** (`studentID`, `isRead`, `createdAt DESC`) that reduces query time from `O(N)` to `O(log N + K)`.
* **Scalability Strategies**: Addressed the "Thundering Herd" problem with Redis caching and cursor-based pagination.
* **Reliability**: Redesigned a brittle sequential email loop into a fault-tolerant **Worker Queue Architecture** (BullMQ/Redis) featuring Idempotency Locks and Dead Letter Queues (DLQ).

### 2. Priority Stream Processor (Stage 6)
* **Algorithm**: Implemented a **Priority Min-Heap** in Node.js (`stage6.js`).
* **Efficiency**: Instead of storing and sorting the entire dataset of 5 million notifications in memory (which would crash a Node instance), the Min-Heap maintains exactly the Top 10 notifications dynamically in `O(N log K)` time.
* **Strict Formatting**: The output has been exactly formatted to the requested JSON specification, capturing the specific `ID`, `Type`, `Message`, and `Timestamp` formats required by the assignment constraints.

### 3. Code Quality & Cleanup
* All codebase files have undergone a strict production cleanup. 
* All development comments, emojis, messy console boundaries, and unused variables have been safely stripped to present a clean, professional, and minimal submission.

## How to Run the Stage 6 Algorithm

1. Install dependencies:
   ```bash
   npm install
   ```
2. Execute the stream processor:
   ```bash
   node stage6.js
   ```
The script will spin up a local mock data stream, process the notifications dynamically through the Min-Heap, and output the clean JSON result.
