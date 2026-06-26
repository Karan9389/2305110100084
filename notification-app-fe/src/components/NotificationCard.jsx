import { Card, CardContent, Stack, Chip, Typography, Box } from "@mui/material";

export function NotificationCard({ notification, isRead, onMarkRead }) {
  const type = notification.type || notification.Type;
  const message = notification.message || notification.Message;
  const timestamp = notification.createdAt || notification.Timestamp || notification.timestamp;
  const id = notification.ID || notification.id;

  return (
    <Card 
      onClick={() => onMarkRead(id)}
      variant="outlined" 
      sx={{ 
        borderRadius: 2,
        cursor: "pointer",
        backgroundColor: isRead ? "transparent" : "#f0f7ff",
        borderColor: isRead ? "divider" : "primary.light",
        transition: "background-color 0.2s ease",
        '&:hover': {
          backgroundColor: isRead ? "#f9f9f9" : "#e3f2fd"
        }
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            {!isRead && (
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main" }} />
            )}
            <Chip 
              label={type} 
              size="small" 
              color={type === 'Placement' ? 'success' : type === 'Result' ? 'warning' : 'info'} 
            />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {timestamp ? new Date(timestamp).toLocaleString() : ''}
          </Typography>
        </Stack>
        
        <Typography variant="body1" sx={{ fontWeight: isRead ? 400 : 600 }}>
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
}