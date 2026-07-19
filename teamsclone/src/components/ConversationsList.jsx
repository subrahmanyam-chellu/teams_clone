import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import ConversationItem from './ConversationItem';
import axios from 'axios';
import socket from './Socket';

const mapRoom = (room, currentUser) => {
  const isGroup = room.roomType === 'group';
  const otherMember = !isGroup ? room.members?.find(m => {
    if (!m) return false;
    const memberId = m._id?.toString() || m?.toString();
    const currentId = currentUser?._id?.toString() || currentUser?.id?.toString();
    return memberId !== currentId;
  }) : null;
  const name = isGroup ? room.roomName : (otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : room.roomName || 'Direct Message');
  const profilePic = isGroup ? room.roomProfile : (otherMember ? otherMember.profilePicture : '');
  
  let lastMessageText = 'No messages yet';
  if (room.lastMessage) {
    if (typeof room.lastMessage === 'object') {
      lastMessageText = room.lastMessage.content || (room.lastMessage.mediaUrl && room.lastMessage.mediaUrl.length > 0 ? 'Attachment' : '');
    } else {
      lastMessageText = room.lastMessage;
    }
  }

  return {
    ...room,
    name,
    profilePic,
    lastMessage: lastMessageText
  };
};

const ConversationsList = ({ setRoom, activeRoomId, refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user from localStorage on mount
  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem("user") || "null");
    setCurrentUser(userObj);
  }, []);

  const fetchRooms = async (currentUserObj) => {
    try {
      const token = localStorage.getItem("x-token");
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/my-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        const mapped = response.data.data.map(r => mapRoom(r, currentUserObj));
        setRooms(mapped);
        
        // Auto-join all socket channels for real-time sidebar preview updates
        mapped.forEach(r => {
          socket.emit("joinRoom", r._id);
        });
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  // Fetch rooms on mount, user load, or refreshTrigger update
  useEffect(() => {
    if (currentUser) {
      fetchRooms(currentUser);
    }
  }, [currentUser, refreshTrigger]);

  // Listen to socket receiveMessage events to update sidebar
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          const rId = r._id?.toString() || r._id;
          const msgRoomId = newMessage.roomId?.toString() || newMessage.roomId;
          if (rId === msgRoomId) {
            const hasMedia = newMessage.mediaUrl && newMessage.mediaUrl.length > 0;
            return {
              ...r,
              lastMessage: newMessage.content || (hasMedia ? 'Attachment' : 'Message'),
              isNew: activeRoomId !== r._id
            };
          }
          return r;
        })
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [activeRoomId]);

  // Filter rooms by search term (name)
  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Search box beside header */}
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
            <ConversationItem 
              key={room._id} 
              room={room} 
              isNew={room.isNew} 
              onClick={() => {
                setRoom(room);
                // Clear the isNew flag locally when a room is clicked
                setRooms(prev => prev.map(r => r._id === room._id ? { ...r, isNew: false } : r));
              }} 
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default ConversationsList;
