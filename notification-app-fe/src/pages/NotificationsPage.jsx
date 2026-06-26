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
  const [tabIndex, setTabIndex] = useState(0); // 0 = Standard Inbox, 1 = Priority Inbox
  const [readIds, setReadIds] = useState([]);

  const { notifications, loading, error } = useNotifications();

  // Load viewed notifications from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("viewed_notifications");
    if (stored) {
      setReadIds(JSON.parse(stored));
    }
  }, []);

  // Mark as read and save to LocalStorage
  const handleMarkAsRead = (id) => {
    if (!id || readIds.includes(id)) return;
    
    const newReadIds = [...readIds, id];
    setReadIds(newReadIds);
    localStorage.setItem("viewed_notifications", JSON.stringify(newReadIds));
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setPage(1); // Reset page on tab switch
  };

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  // Logic for both standard filtering and Priority Top 10
  const displayNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];

    let filtered = notifications;

    if (tabIndex === 0) {
      // Standard Inbox View
      if (filter !== "All") {
        filtered = notifications.filter(n => (n.type || n.Type) === filter);
      }
    } else {
      // Priority Inbox View (Top 10)
      filtered = [...notifications]
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

    return filtered;
  }, [notifications, tabIndex, filter]);

  // Dynamically calculate unread count based on localStorage state
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

      {/* Tabs to simulate a different page for Priority Inbox */}
      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Standard Inbox" />
        <Tab label="Priority Inbox" />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {/* Only show category filters in the standard inbox */}
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
            count={10} // Adjust based on your API's actual total pages
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}