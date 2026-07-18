import React from 'react';
import { Box, Avatar, Typography, Badge, IconButton } from '@mui/material';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ConversationItem = ({ room, isNew, isHeader, onClick }) => {
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
        src={room.profilePic}
        alt={room.name}
        sx={{ mr: 2 }}
      >
        {room.name[0]}
      </Avatar>

      {/* Room name + last message stacked */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
          {room.name}
        </Typography>
        <Typography sx={{ color: '#aaa', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.lastMessage || 'No messages yet'}
        </Typography>
      </Box>

      {/* New badge */}
      {isNew && (
        <Badge color="primary" variant="dot">
          <FiberNewIcon sx={{ color: 'primary.main' }} />
        </Badge>
      )}
    </Box>
  );
};

export default ConversationItem;
