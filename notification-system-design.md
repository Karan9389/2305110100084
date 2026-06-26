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