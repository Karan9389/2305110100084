import { useState, useMemo, useEffect } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
  Tabs,
  Tab
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

const WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [tabIndex, setTabIndex] = useState(0); 
  const [readIds, setReadIds] = useState([]);

  const limit = tabIndex === 1 ? 50 : 10;
  const activeFilter = tabIndex === 0 ? filter : "All";

  const { notifications, loading, error } = useNotifications(page, limit, activeFilter);

  useEffect(() => {
    const stored = localStorage.getItem("viewed_notifications");
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse read notifications.");
      }
    }
  }, []);

  const handleMarkAsRead = (id) => {
    if (!id || readIds.includes(id)) return;
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem("viewed_notifications", JSON.stringify(newReadIds));
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setPage(1); 
  };

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  const displayNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];

    if (tabIndex === 0) {
      return notifications; 
    } else {
      return [...notifications]
        .sort((a, b) => {
          const typeA = a.type || a.Type;
          const typeB = b.type || b.Type;
          const weightA = WEIGHTS[typeA] || 0;
          const weightB = WEIGHTS[typeB] || 0;

          if (weightA !== weightB) {
            return weightB - weightA; 
          }

          const timeA = new Date(a.createdAt || a.Timestamp || a.timestamp).getTime();
          const timeB = new Date(b.createdAt || b.Timestamp || b.timestamp).getTime();
          return timeB - timeA; 
        })
        .slice(0, 10);
    }
  }, [notifications, tabIndex]);

  const unreadCount = notifications 
    ? notifications.filter(n => !readIds.includes(n.ID || n.id)).length 
    : 0;

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 28 }} />
        </Badge>
        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
      </Stack>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Standard Inbox" />
        <Tab label="Priority Inbox" />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {tabIndex === 0 && (
        <Box sx={{ marginBottom: 3 }}>
          <NotificationFilter value={filter} onChange={handleFilterChange} />
        </Box>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">Failed to load notifications: {error}</Alert>
      )}

      {!loading && !error && displayNotifications.length === 0 && (
        <Alert severity="info">No notifications found.</Alert>
      )}

      {!loading && !error && displayNotifications.length > 0 && (
        <Stack spacing={1.5}>
          {displayNotifications.map((n, index) => {
            const id = n.ID || n.id || index;
            return (
              <NotificationCard 
                key={id} 
                notification={n} 
                isRead={readIds.includes(id)}
                onMarkRead={handleMarkAsRead}
              />
            );
          })}
        </Stack>
      )}

      {!loading && tabIndex === 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={10} 
            page={page}
            onChange={(e, p) => setPage(p)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}