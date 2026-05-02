# Vehicle Maintenance Scheduler

A production-ready Node.js microservice designed to handle dynamic vehicle maintenance scheduling across multiple depots using algorithmic optimization.

## Assignment Overview & Implementation Details

This project was built to satisfy all assignment requirements with a strict focus on backend best practices, clean code, and fault tolerance.

### 1. Algorithmic Core (0/1 Knapsack)
At the heart of the service is a dynamic programming implementation of the **0/1 Knapsack algorithm**. 
* **Objective**: Maximize the `impact` of scheduled vehicle maintenance tasks.
* **Constraint**: Do not exceed the available `duration` (Mechanic Hours) for a given depot.
* **Efficiency**: The algorithm is space-optimized and includes a traceback mechanism to exactly identify which vehicles were selected for maintenance.

### 2. Authentication & Resilience
* **Dynamic Registration**: Automatically registers the client against the evaluation API (`POST /register`) and falls back to environment variables gracefully on `409 Conflict`.
* **Token Management**: Acquires an access token (`POST /auth`) and utilizes an Axios interceptor to seamlessly catch `401 Unauthorized` responses, refresh the token, and replay the failed request without dropping data.

### 3. Remote Logging Middleware
* **Fire-and-Forget**: A custom, non-blocking logger that pushes backend events (`info`, `warn`, `error`) to the remote evaluation service.
* **Validation**: It actively filters invalid stack levels and automatically maps internal execution contexts (like `scheduler` or `db`) to the strictly accepted package names expected by the external API.

### 4. Code Quality & Cleanup
* The codebase has undergone a rigorous production cleanup. All development comments, redundant console outputs, and unnecessary blank spaces have been programmatically stripped.
* The architecture follows a strict separation of concerns (`controllers`, `services`, `middleware`, `utils`).

## How to Run

1. Ensure your `.env` file is configured with the necessary registration credentials.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   # OR
   node src/server.js
   ```
4. **Trigger the Scheduler**:
   Send a `GET` request to `http://localhost:3000/api/schedule` to run the algorithm and view the JSON allocations.
