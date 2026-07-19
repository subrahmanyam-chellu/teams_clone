import React from 'react';
import { Box, Avatar, Typography, Badge, IconButton } from '@mui/material';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ConversationItem = ({ room, isNew, isHeader, onClick, subTitle }) => {
  const name = room?.name || room?.roomName || 'Conversation';
  const profilePic = room?.profilePic || room?.roomProfile || '';
  const lastMessageText = subTitle !== undefined ? subTitle : (room?.lastMessage || 'No messages yet');

  return (
    <Box
      sx={{
        maxWidth:'100%',
        display: 'flex',
        alignItems: 'center',
        p: isHeader?0:1.5,
        marginY: 1,
        borderRadius: 2,
        bgcolor: '#2A2A2A',
        cursor: 'pointer',
        '&:hover': { bgcolor: '#3A3A3A' },
      }}
      onClick={onClick}
    >
      {/* Room avatar */}
      <Avatar
        src={profilePic}
        alt={name}
        sx={{ mr: 2 }}
      >
        {name ? name[0] : ''}
      </Avatar>

      {/* Room name + last message stacked */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
          {name}
        </Typography>
        <Typography sx={{ color: subTitle ? '#a3f96d' : '#aaa', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lastMessageText}
        </Typography>
      </Box>

      {/* Unread message count badge */}
      {!isHeader && room?.unreadCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#1c34bb',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            borderRadius: '50%',
            minWidth: 20,
            height: 20,
            px: 0.6,
            ml: 1
          }}
        >
          {room.unreadCount}
        </Box>
      )}
    </Box>
  );
};

export default ConversationItem;
