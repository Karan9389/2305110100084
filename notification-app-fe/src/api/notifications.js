//  endpoint 
const API_URL = "http://4.244.186.213/evaluation-service/notifications";

// access token
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJrYXJhbi5rdW1hcjIwMjNAZ2xiYWphamdyb3VwLm9yZyIsImV4cCI6MTc4MjQ1MzE4MywiaWF0IjoxNzgyNDUyMjgzLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZTc5NWRmYTctNDA2NC00NGZhLWIyMmMtZTRjMzc5NWUwMTJhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoia2FyYW4ga3VtYXIiLCJzdWIiOiJlOTU0NDY2Mi1hMzkxLTQ2OGUtOTYzMS04YzY4NjM5MGQzYjYifSwiZW1haWwiOiJrYXJhbi5rdW1hcjIwMjNAZ2xiYWphamdyb3VwLm9yZyIsIm5hbWUiOiJrYXJhbiBrdW1hciIsInJvbGxObyI6IjIzMDUxMTAxMDAwODQiLCJhY2Nlc3NDb2RlIjoieHhrSm5rIiwiY2xpZW50SUQiOiJlOTU0NDY2Mi1hMzkxLTQ2OGUtOTYzMS04YzY4NjM5MGQzYjYiLCJjbGllbnRTZWNyZXQiOiJ3U0ZHSGRVeWtiZndzdnRZIn0.T2emw9Y5zHbd1JMccS7RAofnWOjs43QyXSvkWwv9zvw";

export async function fetchNotifications() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
}