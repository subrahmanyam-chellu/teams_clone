import React from 'react';
import { Box, Typography } from '@mui/material';
import ConversationItem from '../components/ConversationItem';

const ConversationsList = ({ rooms }) => {
  return (
    <Box
      sx={{
        width: 500,
        bgcolor: '#1A1A1A',
        p: 2,
        flexGrow: 1,
        height: 'calc(100vh - 67px)',
        border: '1px solid #666',
        boxSizing: 'border-box',
        borderRadius: '15px',
        display: 'flex',
        flexDirection: 'column',   // ✅ column layout
      }}
    >
      {/* Header stays at top */}
      <Box sx={{ flexShrink: 0, borderBottom: '1px solid #444', pb: 1 }}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Conversations
        </Typography>
      </Box>

      {/* Scrollable list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
        {!rooms || rooms.length === 0 ? (
          <Typography sx={{ color: '#aaa', fontStyle: 'italic' }}>
            No conversations yet
          </Typography>
        ) : (
          rooms.map((room) => (
            <ConversationItem key={room._id} room={room} isNew={room.isNew} />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ConversationsList;
