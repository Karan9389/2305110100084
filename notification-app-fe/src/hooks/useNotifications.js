import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications"; 

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications();
        setNotifications(data.notifications || data || []); 
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { notifications, loading, error };
}