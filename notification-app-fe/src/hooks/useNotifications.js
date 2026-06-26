import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";

export function useNotifications(page, limit, filterType) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchNotifications({ page, limit, type: filterType });
        setNotifications(data.notifications || data || []); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, limit, filterType]);

  return { notifications, loading, error };
}