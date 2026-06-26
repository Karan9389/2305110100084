import { fetchWithLogging } from "../utils/logger";

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

  return fetchWithLogging(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
  });
}