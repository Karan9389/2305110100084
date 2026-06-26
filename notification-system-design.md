
```markdown
# Stage 1

### Core Actions
After looking at the requirements, I think the notification platform needs to handle four main things for logged-in users:
1. **Fetch Notifications:** Getting the actual list of notifications, paginated, and ideally letting the user filter them by type (Placement, Result, Event).
2. **Get Unread Count:** A quick lightweight call just to get the number for the little red badge in the UI. 
3. **Mark as Read:** Updating a single notification when the user clicks it.
4. **Mark All as Read:** A bulk action so users can clear their inbox quickly.

### REST API Endpoints & Contracts

For all these endpoints, I'm assuming we'll pass the standard `Authorization: Bearer <token>` in the headers to identify the user.

**1. Fetch Notifications**
* **Endpoint:** `GET /api/v1/notifications`
* **Query Params:** `page` (default 1), `limit` (default 10), and `type` (optional, for filtering).
* **Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": "a1b2c3d4",
        "type": "Placement",
        "title": "Interview Scheduled",
        "message": "Your technical round is tomorrow.",
        "isRead": false,
        "actionUrl": "/interviews/123",
        "createdAt": "2026-06-26T10:00:00Z"
      }
    ],
    "pagination": { "total": 45, "totalPages": 5, "currentPage": 1 }
  }
}

```

---

# Stage 2

### Database Choice

I would recommend using a relational database such as PostgreSQL.
Even though NoSQL seems appealing because of the large volumes, our notifications' data is highly structured. We know it will always contain elements like type, user ID, status, and message. Postgres does very well with structured data, its indexing is top-notch, and if we ever need to store extra metadata for specific types of notifications, we can easily use a `JSONB` column.

### Database Schema

Here is a rough idea of the notifications table:

* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key, Indexed)
* `type` (VARCHAR - Placement, Result, Event)
* `title` (VARCHAR)
* `message` (TEXT)
* `is_read` (BOOLEAN, default false, Indexed)
* `created_at` (TIMESTAMP, default now)

*Crucial part:* I would add a composite index on `(user_id, created_at DESC)` and another on `(user_id, is_read)` to make our two main API calls lightning fast.

### Scaling as Volume Increases

When we hit millions of rows, things will start breaking. Here is how I would solve it:

* **Data Archiving (TTL):** Nobody cares about an interview notification from three months ago. We should run a background cron job to move notifications older than ~60 days to cheaper cold storage like AWS S3.
* **Partitioning:** We can partition the Postgres table by month. This keeps index sizes small and makes deleting old data basically instant.
* **Caching:** We absolutely shouldn't be running `COUNT()` queries on the database just to update the unread badge. We should cache the unread count for active users in Redis.

### The SQL Queries

**1. Fetch paginated list:**

```sql
SELECT id, type, title, message, is_read, action_url, created_at
FROM notifications
WHERE user_id = 'user123' AND type = 'Placement'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;

```

**2. Unread Count:**

```sql
SELECT COUNT(id) FROM notifications WHERE user_id = 'user123' AND is_read = false;

```

---

# Stage 3

### Analysis of the Slow Query

Here is the slow query developed by the previous developer:

```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;

```

**Is the query correct?** No. The problem is that it uses `createdAt ASC`, which means the student sees their oldest notifications first. This must be changed to `DESC`.

**Why is the query slow?** There are two main reasons:

1. **Lack of composite index:** It filters by the student ID, then reads the read status, and then sorts the data. We need to create a composite index for the query to work efficiently. `CREATE INDEX idx_student_unread ON notifications (studentID, isRead, createdAt DESC);`
2. **`SELECT *`:** It pulls all columns, including massive text bodies, over the network unnecessarily.

### Is "Index All Columns" Good Advice?

Absolutely not. Indexing all columns means that whenever a new entry is written to the table, every single index has to be updated. This will create massive bottlenecks in write-heavy workloads and bloat the storage space drastically.

### Query for Recent Placements

```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt >= NOW() - INTERVAL 7 DAY;

```

---

# Stage 4

### Overcoming an Overwhelmed DB

If the database is struggling because the frontend is making notification requests every time a page is refreshed, it ultimately comes down to a polling issue. We need to cut off the direct flow of requests from the frontend to the database.

These are my proposed solutions:

**Solution 1: Introduce a Redis Cache**

* **How it works:** Every time a user logs in, we grab their notifications and unread count and store them in Redis. For the next several minutes, every page refresh requests that information from Redis rather than the primary database.
* **Pros/Cons:** It greatly relieves the database load and is extremely fast. The downside is eventual consistency; we need to implement proper cache invalidation to prevent the user from missing an important notification.

**Solution 2: Use SSE (Server-Sent Events)**

* **How it works:** We stop making the frontend request data on each route switch. The frontend requests the data once upon login and keeps an SSE connection open. The server then pushes new notifications directly to the client as they happen.
* **Pros/Cons:** It eliminates redundant database hits entirely and provides a true real-time user experience. However, the backend now has to maintain thousands of open connections, which requires significantly more memory.

---

# Stage 5

### Shortcomings of the Current Implementation

Looking at the provided pseudocode, there are three massive red flags for a production system trying to process 50,000 users:

1. **It is Synchronous and Blocking:** The code runs in a sequential `for` loop. If the Email API takes just 200ms per request, processing 50,000 students will take almost three hours. The UI will likely time out, leaving the HR user wondering if it actually worked.
2. **Zero Fault Tolerance:** As the logs indicated, it failed midway through. In a standard loop, an unhandled exception breaks the entire process. The remaining students get nothing, and it is incredibly difficult to retry the failed ones without accidentally sending duplicate emails to the students who already received them.
3. **Tight Coupling:** The system ties a fast, internal operation (saving to our DB) to a slow, external operation (calling a third-party Email API).

### Should DB saving and Email happen together?

**Absolutely not.** They need to be decoupled.
Writing to our database is mission-critical for our application's state and is extremely fast. Sending an email relies on an external provider (like SendGrid or AWS SES), which is subject to network latency, rate limits, and unexpected downtimes. A failure in the external email service should never prevent the notification from appearing inside our actual app.

### The Redesign: Message Queues

To make this reliable and fast, we need an asynchronous, event-driven architecture.

When HR clicks "Notify All", the main thread should only do two things: execute a single bulk insert into the database, and quickly push the jobs into a Message Broker (like RabbitMQ, Kafka, or Redis/BullMQ). Background worker servers will then pull jobs from these queues at their own pace.

### Revised Pseudocode

```javascript
const emailQueue = new Queue('email_notifications');
const pushQueue = new Queue('app_push_notifications');

async function notifyAll(studentIds, message) {
    try {
        await bulkSaveToDb(studentIds, message);
        
        const emailJobs = studentIds.map(id => ({ 
            name: 'sendEmail', 
            data: { studentId: id, message } 
        }));
        
        const pushJobs = studentIds.map(id => ({ 
            name: 'sendPush', 
            data: { studentId: id, message } 
        }));

        await emailQueue.addBulk(emailJobs);
        await pushQueue.addBulk(pushJobs);
        
        return { success: true, message: "Notifications queued successfully." };
    } catch (error) {
        console.error("Failed to queue notifications", error);
    }
}

emailQueue.process('sendEmail', async (job) => {
    try {
        await sendEmailAPI(job.data.studentId, job.data.message);
    } catch (error) {
        throw new Error("Email API Failed, retrying..."); 
    }
});

pushQueue.process('sendPush', async (job) => {
    await pushToAppWebSocket(job.data.studentId, job.data.message);
});

```
## Stage 6

### Priority Inbox Algorithm
In order to provide a "Priority Inbox" which will always display the 10 most important notifications, the sorting should be done on two aspects:
1. **Main Sorting by Weight:** Placement (Weight: 3) > Result (Weight: 2) > Event (Weight: 1);
2. **Secondary Sorting by Recency:** newest first (`DESC`).

### Efficient Sorting of Real-Time Stream
Doing `O(N log N)` sorting of the whole array every time when the new record is added by real-time stream is not very efficient.

As we need just **Top 10** records, we do not have to sort all records ever received. The optimal algorithm here is to keep bounded sorted array (or Min-Heap) consisting of 10 elements.
When a new record comes:
1. It should be compared with the lowest priority element currently present in the Top 10;
2. If it has greater weight (or same weight but more recent), then it should be inserted at the proper place using Binary Insertion `O(log 10)`;
3. And the 11-th element should be popped from the end of the array.
Since the array will never contain more than 10 elements, the insertion complexity will actually become `O(1)`.
```

```