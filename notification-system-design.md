
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
Even though NoSQL seems appealing because of the large volumes, our notifications' data is really structured (we know that it will always contain the following elements: type, user id, status, and message). Postgres does very well with structured data, its indexing is top-notch, and in case we need to store some extra metadata for certain types of notifications, we could use a `JSONB` column.

### Database Schema

Here's a rough idea of the notifications table:

* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key, Indexed)
* `type` (VARCHAR - Placement, Result, Event)
* `title` (VARCHAR)
* `message` (TEXT)
* `is_read` (BOOLEAN, default false, Indexed)
* `created_at` (TIMESTAMP, default now)

*Crucial part:* I'd add a composite index on `(user_id, created_at DESC)` and another on `(user_id, is_read)` to make our two main API calls lightning fast.

### Scaling as Volume Increases

When we hit millions of rows, things will start breaking. Here is how I'd solve it:

* **Data Archiving (TTL):** Nobody cares about an interview notification from 3 months ago. We should run a background cron job to move notifications older than ~60 days to cheaper cold storage like S3.
* **Partitioning:** We can partition the Postgres table by month. This keeps index sizes small and makes deleting old data basically instant.
* **Caching:** We absolutely shouldn't be running `COUNT()` queries on the DB for the unread badge. We should cache the unread count for active users in Redis.

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

Here is the query for this particular slow query developed by the previous developer:

```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;

```

**Is the query correct?** No, the problem with the query is that it uses `createdAt ASC` order, therefore the student sees the oldest notifications first. This must be changed to `DESC`.

**Why is the query slow?** There are two reasons why it is slow:

1. **Lack of composite index:** It filters by the student ID, then reads the status, and then sorts the data. We need to make a composite index for the query to work properly. `CREATE INDEX idx_student_unread ON notifications (studentID, isRead, createdAt DESC);`
2. **`SELECT *`:** It pulls all the columns, including large text notifications, through the network.

### Is "Index All Columns" Good Advice?

Absolutely not! Indexing all columns means that whenever a new entry is written in the table, all indexes have to be updated. It is going to create bottlenecks in write-heavy workloads and the storage space will get bloated.

### Query for Recent Placements

```sql
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt >= NOW() - INTERVAL 7 DAY;

```

---

# Stage 4

### Overcoming Overwhelmed DB

If the database is struggling because the frontend is making notifications requests every time the page is refreshed, then it basically comes down to a polling issue. We need to stop the flow from the frontend directly to DB.

These are my solutions:

**Solution #1: Introduce Redis Cache**

* **How it works:** Every time a user logs in, we grab his/her notifications and unread count and put them in the Redis. In the next several minutes, every page refresh would request those info not from DB but from Redis.
* **Pros/Cons:** It greatly relieves DB from the load and is extremely fast. Con is eventual consistency and we need to implement proper cache invalidation to prevent the user missing some notification.

**Strategy 2: Use SSE (Server-Sent Events)**

* **How does it work?** We stop making the front end request data on each route switch. The front-end will request the data only once upon login and will keep the SSE connection open. The server simply sends the notification directly to the client without any delay.
* **Pros and Cons:** No redundant DB hits and a real-time user experience; but now we have to maintain thousands of open connections on the back end that require lots of memory.

```
---

# Stage 5

### Shortcomings of the Current Implementation
Looking at the provided pseudocode, there are three massive red flags for a production system trying to process 50,000 users:

1. **It's Synchronous and Blocking:** The code runs in a sequential `for` loop. If the Email API takes just 200ms per request, processing 50,000 students will take almost 3 hours. The UI will likely time out, leaving the HR user wondering if it actually worked.
2. **Zero Fault Tolerance:** As the logs indicated, it failed on 200 students midway. In a standard loop, an unhandled exception breaks the entire process. The remaining students get nothing, and it's incredibly difficult to retry the failed ones without accidentally sending duplicate emails to the students who already received them.
3. **Tight Coupling:** The system ties a fast, internal operation (saving to our DB) to a slow, external operation (calling a third-party Email API). 

### Should DB saving and Email happen together?
**Absolutely not.** They need to be decoupled. 
Writing to our database is mission-critical for our application's state and is extremely fast. Sending an email relies on an external provider (like SendGrid or AWS SES), which is subject to network latency, rate limits, and unexpected downtimes. A failure in the external email service should never prevent the notification from appearing inside our actual app.

### The Redesign: Message Queues
To make this reliable and lightning-fast, we need an asynchronous, event-driven architecture. 

When HR clicks "Notify All", the main thread should only do two things: execute a single **bulk insert** into the database, and quickly push 50,000 "jobs" into a Message Broker (like RabbitMQ, Kafka, or Redis/BullMQ). Then, background worker servers will pull jobs from these queues at their own pace.
### Revised Pseudocode
```
---
const emailQueue = new Queue('email_notifications');
const pushQueue = new Queue('app_push_notifications');

async function notifyAll(studentIds, message) {
    try {
        await bulkSaveToDb(studentIds, message);
        
        // 2. Map arrays to job objects for the queues
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
        // Throwing an error tells the queue to retry this specific job later
        throw new Error("Email API Failed, retrying..."); 
    }
});
pushQueue.process('sendPush', async (job) => {
    await pushToAppWebSocket(job.data.studentId, job.data.message);
});
```

```