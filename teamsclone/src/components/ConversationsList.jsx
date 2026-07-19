import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Fab } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
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
    lastMessage: lastMessageText,
    unreadCount: room.unreadCount || 0
  };
};

const ConversationsList = ({ setRoom, activeRoomId, refreshTrigger, onNewChatClick, onNewGroupClick, isChatPage, isTeamsPage, selectRoomId }) => {
  const [rooms, setRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Invite states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInviteSubmit = () => {
    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      alert("Invalid email format. Please check and try again.");
      return;
    }

    // Nodemailer logic will be implemented here in the future
    console.log(`Invite prepared for: ${inviteEmail}`);
    alert(`Invite link prepared for ${inviteEmail}. (Nodemailer will send this in the future)`);
    setInviteEmail('');
    setInviteDialogOpen(false);
  };

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
        let roomsData = response.data.data || [];
        if (isChatPage) {
          roomsData = roomsData.filter(r => r.roomType === 'private');
        } else if (isTeamsPage) {
          roomsData = roomsData.filter(r => r.roomType === 'group');
        }
        const mapped = roomsData.map(r => mapRoom(r, currentUserObj));
        setRooms(mapped);
        
        // Auto-select room matching selectRoomId prop
        if (selectRoomId) {
          const matched = mapped.find(r => r._id === selectRoomId);
          if (matched) {
            setRoom(matched);
          }
        }

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
      setRooms((prevRooms) => {
        const msgRoomId = (newMessage.roomId?.toString() || newMessage.roomId);
        const roomToUpdate = prevRooms.find(r => (r._id?.toString() || r._id) === msgRoomId);
        if (!roomToUpdate) return prevRooms;

        const hasMedia = newMessage.mediaUrl && newMessage.mediaUrl.length > 0;
        const updatedRoom = {
          ...roomToUpdate,
          lastMessage: newMessage.content || (hasMedia ? 'Attachment' : 'Message'),
          unreadCount: activeRoomId === roomToUpdate._id ? 0 : (roomToUpdate.unreadCount || 0) + 1
        };

        const otherRooms = prevRooms.filter(r => (r._id?.toString() || r._id) !== msgRoomId);
        return [updatedRoom, ...otherRooms];
      });
    };

    const handleMessageEdited = (editedMessage) => {
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          const rId = r._id?.toString() || r._id;
          const msgRoomId = editedMessage.roomId?.toString() || editedMessage.roomId;
          if (rId === msgRoomId) {
            const hasMedia = editedMessage.mediaUrl && editedMessage.mediaUrl.length > 0;
            return {
              ...r,
              lastMessage: editedMessage.content || (hasMedia ? 'Attachment' : 'Message')
            };
          }
          return r;
        })
      );
    };

    const handleMessageDeleted = (data) => {
      setRooms((prevRooms) =>
        prevRooms.map((r) => {
          const rId = r._id?.toString() || r._id;
          const msgRoomId = data.roomId?.toString() || data.roomId;
          if (rId === msgRoomId) {
            return {
              ...r,
              lastMessage: 'Message was deleted'
            };
          }
          return r;
        })
      );
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
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
        position: 'relative',
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
          {isChatPage ? 'Chats' : isTeamsPage ? 'Teams' : 'Conversations'}
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

        {/* Invite icon to the right side of the searchbar */}
        {isChatPage && (
          <Tooltip title="Invite New User">
            <IconButton 
              onClick={() => setInviteDialogOpen(true)} 
              sx={{ color: '#fff', '&:hover': { bgcolor: '#2A2A2A' } }}
              size="small"
            >
              <PersonAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
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
              onClick={() => {
                setRoom(room);
                // Clear the unreadCount locally when a room is clicked
                setRooms(prev => prev.map(r => r._id === room._id ? { ...r, unreadCount: 0 } : r));
              }} 
            />
          ))
        )}
      </Box>

      {/* Floating Action Button for New Chat */}
      {isChatPage && onNewChatClick && (
        <Tooltip title="New Chat" placement="left">
          <Fab 
            onClick={onNewChatClick}
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              bgcolor: '#1c34bb',
              color: '#fff',
              '&:hover': { bgcolor: '#152999' }
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Floating Action Button for New Group/Team Chat */}
      {isTeamsPage && onNewGroupClick && currentUser?.role === 'ADMIN' && (
        <Tooltip title="Create Group" placement="left">
          <Fab 
            onClick={onNewGroupClick}
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              bgcolor: '#1c34bb',
              color: '#fff',
              '&:hover': { bgcolor: '#152999' }
            }}
          >
            <GroupIcon />
          </Fab>
        </Tooltip>
      )}
      {/* Invite Dialog Box */}
      <Dialog 
        open={inviteDialogOpen} 
        onClose={() => { setInviteDialogOpen(false); setInviteEmail(''); }} 
        fullWidth 
        maxWidth="xs" 
        slotProps={{
          paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Invite New User</Typography>
          <IconButton size="small" onClick={() => { setInviteDialogOpen(false); setInviteEmail(''); }} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); handleInviteSubmit(); }}>
          <DialogContent sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              slotProps={{ inputLabel: { style: { color: '#bbb' } } }}
              sx={{
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  '& input': { color: '#f0f0f0' },
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #444', p: 1.5 }}>
            <Button onClick={() => { setInviteDialogOpen(false); setInviteEmail(''); }} sx={{ color: '#ccc', '&:hover': { color: '#fff', bgcolor: '#2A2A2A' } }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', bgcolor: '#a3f96d', color: '#000', fontWeight: 'bold', '&:hover': { bgcolor: '#8ee05c' } }}>Send Invite</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ConversationsList;
