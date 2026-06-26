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



Stage 2
Database Choice
Iwould recommend using a relational database such as PostgreSQL.
Even though NoSQL seems appealing because of the large volumes, our notifications' data is really structured (we know that it will always contain the following elements: type, user id, status, and message). Postgres does very well with structured data, its indexing is top-notch, and in case we need to store some extra metadata for certain types of notifications, we could use JSONB column.

Database Schema
Here's a rough idea of the notifications table:

id (UUID, Primary Key)
user_id (UUID, Foreign Key, Indexed)
type (VARCHAR - Placement, Result, Event)
title (VARCHAR)
message (TEXT)
is_read (BOOLEAN, default false, Indexed)
created_at (TIMESTAMP, default now)


Crucial part: I'd add a composite index on (user_id, created_at DESC) and another on (user_id, is_read) to make our two main API calls lightning fast.

Scaling as Volume Increases
When we hit millions of rows, things will start breaking. Here is how I'd solve it:

Data Archiving (TTL): Nobody cares about an interview notification from 3 months ago. We should run a background cron job to move notifications older than ~60 days to cheaper cold storage like S3.

Partitioning: We can partition the Postgres table by month. This keeps index sizes small and makes deleting old data basically instant.

Caching: We absolutely shouldn't be running COUNT() queries on the DB for the unread badge. We should cache the unread count for active users in Redis.

The SQL Queries
1. Fetch paginated list:

SQL
SELECT id, type, title, message, is_read, action_url, created_at
FROM notifications
WHERE user_id = 'user123' AND type = 'Placement'
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
2. Unread Count:

SQL
SELECT COUNT(id) FROM notifications WHERE user_id = 'user123' AND is_read = false;



Step 3
Analysis of the Slow Query
Here is the query for this particular slow query developed by the previous developer:
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;

Is the query correct? No, the problem with the query is that it uses createdAt ASC order, therefore the student sees the oldest notifications first. This must be changed to DESC.

Why is the query slow? There are two reasons why it is slow:

Lack of composite index: it filters by the student ID, then reads the status, and then sorts the data. We need to make a composite index for the query to work properly. CREATE INDEX idx_student_unread ON notifications (studentID, isRead, createdAt DESC);

SELECT * : It pulls all the columns, including large text notifications, through the network.

Is "Index All Columns" Good Advice?
Absolutely not! Indexing all columns means that whenever a new entry is written in the table, all indexes have to be updated. It is going to create bottlenecks in write-heavy workloads and the storage space will get bloated.

Query for Recent Placements
SQL
SELECT DISTINCT studentID 
FROM notifications 
WHERE notificationType = 'Placement' 
AND createdAt >= NOW() - INTERVAL 7 DAY