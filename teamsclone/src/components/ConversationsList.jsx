import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ConversationItem from '../components/ConversationItem';

const ConversationsList = ({setRoom}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [rooms] = useState([
    {
      _id: "room1",
      name: "Alice & Bob",
      profilePic: "https://i.pravatar.cc/150?img=3",
      lastMessage: "Hey Bob! How are you?",
      isNew: true,
    },
    {
      _id: "room2",
      name: "Team Project",
      profilePic: "https://i.pravatar.cc/150?img=4",
      lastMessage: "Meeting at 5 PM",
      isNew: false,
    },
    {
      _id: "room3",
      name: "Family Group",
      profilePic: "https://i.pravatar.cc/150?img=5",
      lastMessage: "Dinner is ready 🍲",
      isNew: true,
    },
  ]);

  // Filter rooms by search term (name or lastMessage)
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        flexDirection: 'column',
      }}
    >
      {/* Header with search box */}
      <Box
        sx={{
          flexShrink: 0,
          borderBottom: '1px solid #444',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Conversations
        </Typography>

        {/* ✅ Search box beside header */}
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flexGrow: 1,
            padding: '6px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#333',
            color: '#fff',
          }}
        />
      </Box>

      {/* Scrollable list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
        {filteredRooms.length === 0 ? (
          <Typography sx={{ color: '#aaa', fontStyle: 'italic' }}>
            No conversations found
          </Typography>
        ) : (
          filteredRooms.map((room) => (
            <ConversationItem key={room._id} room={room} isNew={room.isNew} onClick={()=>{setRoom(room)}} />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ConversationsList;
