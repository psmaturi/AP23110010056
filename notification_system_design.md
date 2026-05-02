# Stage 1

## REST API Design

### 1. Fetch Notifications
*   **Endpoint:** `GET /api/v1/notifications`
*   **Headers:** `Authorization: Bearer <jwt_token>`
*   **Query Params:** `cursor` (string, optional), `limit` (integer, default: 20)
*   **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "ID": "evt_9021",
          "Type": "Placement",
          "Message": "Amazon Interview Shortlist",
          "Timestamp": "2026-05-02 10:00:00",
          "isRead": false
        }
      ],
      "meta": { "nextCursor": "evt_8832" }
    }
    ```
*   **Validation Rules:** JWT must be valid. `limit` cannot exceed 50.

### 2. Create Notification
*   **Endpoint:** `POST /api/v1/notifications`
*   **Headers:** `Authorization: Bearer <service_token>`
*   **Request JSON:**
    ```json
    {
      "targetCohort": "CS_2026",
      "Type": "Result",
      "Message": "Semester 6 Results Declared",
      "priority": "High"
    }
    ```
*   **Response (202 Accepted):** `{"success": true, "message": "Notification queued"}`
*   **Validation Rules:** `Type` must be strictly `['Placement', 'Result', 'Event']`. `targetCohort` is required.

### 3. Mark as Read
*   **Endpoint:** `PATCH /api/v1/notifications/:id/read`
*   **Headers:** `Authorization: Bearer <jwt_token>`
*   **Request JSON:** *(Empty body)*
*   **Response (200 OK):** `{"success": true}`
*   **Status Codes:** `404 Not Found` if the notification ID doesn't exist for the user.

### 4. Get Unread Count
*   **Endpoint:** `GET /api/v1/notifications/unread-count`
*   **Headers:** `Authorization: Bearer <jwt_token>`
*   **Response (200 OK):** `{"success": true, "count": 14}`

## Real-Time Delivery Design (WebSockets)
We use WebSockets instead of SSE or long-polling because a campus app often multiplexes multiple real-time feeds (chat, online status, notifications) over a single persistent TCP connection. 

**Backend Push Mechanism:**
When `POST /api/v1/notifications` successfully resolves via the background queue and inserts rows into the database, the worker publishes a payload to a Redis Pub/Sub channel. The Node.js WebSocket servers (which hold the active TCP sockets mapped to `userId`s) listen to this channel. Upon receiving the payload, the socket server instantly emits a `notification:new` event exclusively to the targeted connected clients.

---

# Stage 2

## Database Design

**Choice: PostgreSQL**
*Justification:* Campus notifications often require broadcasting a single message to thousands of users (e.g., a cohort of 2,000 students). Document databases like MongoDB can lead to massive duplication or complex array-updating logic for "read" states. Postgres allows us to use an "Inbox" schema, where we write the broadcast message once, and only write user states when they explicitly interact with it.

### Schema Design

```sql
-- Core Notification Payload (Written once per broadcast)
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    target_cohort VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Read State (Written only when interacted)
CREATE TABLE user_notification_reads (
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, notification_id)
);
```

### Indexing Strategy (Crucial)
*   `CREATE INDEX idx_notifications_cohort_time ON notifications(target_cohort, created_at DESC);`
*   The primary key on `user_notification_reads` inherently builds a composite index on `(user_id, notification_id)`, allowing O(1) checks for read status.

### Problems at Scale (50k users, 5M notifications)
1.  **Read Table Bloat:** Tens of millions of read states will slow down sequential scans and `VACUUM` operations.
2.  **Unread Count Locking:** Calculating the exact unread count by doing a massive `LEFT JOIN` on 5M rows locks DB CPU.

**Solutions:**
*   **Caching (Redis):** Keep `unread_count:{userId}` purely in Redis memory. Increment via pipeline on broadcast, decrement on read.
*   **Partitioning:** Time-partition the `user_notification_reads` table by month. Old partitions can be archived or dropped since 6-month-old notifications are rarely clicked.
*   **Read Replicas:** Route heavy `GET` queries to read-only instances to protect the primary Node.js write pool.

### Queries

**Fetch notifications:**
```sql
SELECT n.id, n.type, n.message, n.created_at, 
       CASE WHEN r.read_at IS NULL THEN false ELSE true END AS is_read
FROM notifications n
LEFT JOIN user_notification_reads r 
       ON n.id = r.notification_id AND r.user_id = $1
WHERE n.target_cohort = $2
ORDER BY n.created_at DESC LIMIT 20;
```

**Mark as read:**
```sql
INSERT INTO user_notification_reads (user_id, notification_id)
VALUES ($1, $2) ON CONFLICT DO NOTHING;
```

**Count unread (Fallback if Redis misses):**
```sql
SELECT COUNT(*) FROM notifications n
LEFT JOIN user_notification_reads r 
       ON n.id = r.notification_id AND r.user_id = $1
WHERE n.target_cohort = $2 AND r.notification_id IS NULL;
```

---

# Stage 3

## Query Optimization

**The Slow Query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Why is it slow?**
Without indices, the database executes a **Sequential Scan**, parsing every row on disk. Even if `studentID` is indexed, the engine still pulls thousands of rows into memory, filters out `isRead = true`, and then triggers an expensive **Filesort** algorithm to organize them by `createdAt`. Doing this in RAM for thousands of concurrent students will spike CPU usage instantly.

**Optimization:**
We use a Composite Index covering the exact access pattern and sort direction.
```sql
CREATE INDEX idx_student_unread_time ON notifications (studentID, isRead, createdAt DESC);
```

**Performance Improvement:**
This changes the DB engine operation from **O(N)** to **O(log N + K)**. By indexing the query parameters *and* the sort direction, the Postgres B-Tree naturally stores the exact unread rows for that student pre-sorted. The database skips the Filesort phase entirely and immediately reads the first pointers.

**Is indexing every column good?**
No.
1.  **Write Penalty:** Every `INSERT`, `UPDATE`, or `DELETE` forces the database to synchronously rebuild index trees.
2.  **Storage Bloat:** Postgres uses MVCC. Frequent updates (like toggling `isRead`) create dead tuples, severely bloating disk usage and degrading read performance until the garbage collector (`VACUUM`) runs.

**Find students who got "Placement" notifications in last 7 days:**
*(Assuming an architecture where student IDs are mapped to notifications)*
```sql
SELECT DISTINCT student_id 
FROM student_notifications
WHERE type = 'Placement' 
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

# Stage 4

## Scalability

**Problem:** The DB is overloaded due to frequent fetching when 50,000 users open the app simultaneously.

### Backend Solutions

1.  **Redis Caching:**
    *   `Key: notif:feed:{userId}` -> Stores a stringified JSON array of the top 20 pre-rendered notifications.
    *   `Key: notif:unread:{userId}` -> Integer for the badge count.
    *   **Logic:** `GET /notifications` attempts `redis.get()` first. On a miss, it queries Postgres and runs `redis.setex(key, 3600, data)`.
2.  **Cursor-Based Pagination:**
    *   Avoid SQL `OFFSET 1000`. Instead, the frontend passes `?cursor=2026-05-02T10:00:00Z`.
    *   SQL translation: `WHERE created_at < $1 ORDER BY created_at DESC LIMIT 20`. This keeps database fetch time strictly constant `O(1)` regardless of page depth.
3.  **Push vs Polling:**
    *   Rely entirely on the WebSocket push mechanism to alert the client of new data. Disable any client-side `setInterval` polling that hammers the API.
4.  **API Optimization:**
    *   Only fetch the metadata for the list view. Lazy-load heavy notification body text only when the user explicitly taps on it.

### Tradeoffs
*   **Performance vs Consistency:** Caching introduces eventual consistency. A user might mark an item read on their phone, but their laptop browser might show it unread for a few seconds until the cache TTL expires or is explicitly invalidated.
*   **Cache Invalidation Challenges:** The "Thundering Herd" problem. If the cache clears or is evicted under memory pressure, 50k users might bypass Redis and hit Postgres simultaneously. We mitigate this using stale-while-revalidate patterns.

---

# Stage 5

## Reliability

**Redesigning the Notification System:**
A sequential `for` loop in an Express route crashes the server and drops data. We must use a robust queue architecture.

1.  **Queue System:** **BullMQ (Redis-backed)**
2.  **Worker Architecture:** The API receives the request and pushes a single "Master Job". A worker picks this up and chunks the 50,000 target users into 100 smaller jobs (500 users each). Email workers process these chunks concurrently.
3.  **Idempotency:** A Redis lock `SETNX sent:{notif_id}:{user_id}` ensures no student receives the same email twice, even if BullMQ re-delivers the message due to a timeout.
4.  **Retry & Dead Letter Queue (DLQ):** If SendGrid times out, BullMQ uses exponential backoff. After 5 failures, the job is moved to a DLQ for manual engineering review.

**What happens if the email fails midway?**
Because we process in chunks and maintain idempotency locks in Redis, state is not lost. The worker restarts, the Redis lock prevents the first half from receiving duplicates, and the un-emailed second half successfully processes.

**Should DB write and email happen together?**
No. They are decoupled. The database write (Notification creation) happens immediately in the primary API transaction. The email delivery is asynchronous. If the email fails, the notification is still safely stored in the app's inbox.

**Node.js Pseudocode:**
```javascript
// Queue Producer
const emailQueue = new Queue('EmailDelivery');

async function dispatch(notificationId, userIds) {
    const chunks = chunkArray(userIds, 500);
    for (const chunk of chunks) {
        await emailQueue.add('sendBatch', { notificationId, users: chunk }, {
            attempts: 5, backoff: { type: 'exponential', delay: 1000 }
        });
    }
}

// Queue Consumer (Worker)
const worker = new Worker('EmailDelivery', async (job) => {
    const { notificationId, users } = job.data;
    
    for (const user of users) {
        const lockKey = `sent:${notificationId}:${user.id}`;
        if (!(await redis.setnx(lockKey, "1"))) continue; // Idempotency check

        try {
            await emailProvider.send(user.email, "Campus Update");
            await redis.expire(lockKey, 604800); // 7 day TTL
        } catch (err) {
            await redis.del(lockKey); // Release lock to allow retry
            throw err; // Triggers BullMQ retry mechanism
        }
    }
});
```
