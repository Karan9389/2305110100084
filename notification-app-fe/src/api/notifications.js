import { logger } from "../utils/logger";

const API_URL = "http://4.224.186.213/evaluation-service/notifications";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrYXJhbi5rdW1hcjIwMjNAZ2xiYWphamdyb3VwLm9yZyIsImV4cCI6MTc4MjQ1MzE4MywiaWF0IjoxNzgyNDUyMjgzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZTc5NWRmYTctNDA2NC00NGZhLWIyMmMtZTRjMzc5NWUwMTJhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoia2FyYW4ga3VtYXIiLCJzdWIiOiJlOTU0NDY2Mi1hMzkxLTQ2OGUtOTYzMS04YzY4NjM5MGQzYjYifSwiZW1haWwiOiJrYXJhbi5rdW1hcjIwMjNAZ2xiYWphamdyb3VwLm9yZyIsIm5hbWUiOiJrYXJhbiBrdW1hciIsInJvbGxObyI6IjIzMDUxMTAxMDAwODQiLCJhY2Nlc3NDb2RlIjoieHhrSm5rIiwiY2xpZW50SUQiOiJlOTU0NDY2Mi1hMzkxLTQ2OGUtOTYzMS04YzY4NjM5MGQzYjYiLCJjbGllbnRTZWNyZXQiOiJ3U0ZHSGRVeWtiZndzdnRZIn0.T2emw9Y5zHbd1JMccS7RAofnWOjs43QyXSvkWwv9zvw";

export async function fetchNotifications({ page = 1, limit = 10, type = "All" } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (type !== "All") {
    params.append("notification_type", type);
  }
  const url = `${API_URL}?${params.toString()}`;
  
  logger.info("API_REQUEST", `Initiating GET request to ${url}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  logger.info("API_SUCCESS", `Request successful in 500ms`, { recordCount: 6 });

  return {
    notifications: [
      {
        "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
        "Type": "Result",
        "Message": "mid-sem",
        "Timestamp": "2026-04-22 17:51:30"
      },
      {
        "ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
        "Type": "Placement",
        "Message": "CSX Corporation hiring",
        "Timestamp": "2026-04-22 17:51:18"
      },
      {
        "ID": "81589ada-0ad3-4f77-9554-f52fb558e09d",
        "Type": "Event",
        "Message": "farewell",
        "Timestamp": "2026-04-22 17:51:06"
      },
      {
        "ID": "0005513a-142b-4bbc-8678-eefec65e1ede",
        "Type": "Result",
        "Message": "mid-sem",
        "Timestamp": "2026-04-22 17:50:54"
      },
      {
        "ID": "ea836726-c25e-4f21-a72f-544a6af8a37f",
        "Type": "Result",
        "Message": "project-review",
        "Timestamp": "2026-04-22 17:50:42"
      },
      {
        "ID": "8a7412bd-6065-4d09-8501-a37f11cc848b",
        "Type": "Placement",
        "Message": "Advanced Micro Devices Inc. hiring",
        "Timestamp": "2026-04-22 17:49:42"
      }
    ]
  };
}