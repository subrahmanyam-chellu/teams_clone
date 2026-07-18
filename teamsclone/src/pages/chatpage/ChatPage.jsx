import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemAvatar, ListItemText, Checkbox, Button, Avatar, CircularProgress } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import ChatWindow from '../../components/ChatWindow';
import ConversationsList from '../../components/ConversationsList';
import socket from '../../components/Socket';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const mapRoom = (room, currentUser) => {
  const isGroup = room.roomType === 'group';
  const otherMember = !isGroup ? room.members?.find(m => m._id !== currentUser?._id && m._id !== currentUser?.id) : null;
  const name = isGroup ? room.roomName : (otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : room.roomName || 'Direct Message');
  const profilePic = isGroup ? room.roomProfile : (otherMember ? otherMember.profilePicture : '');
  
  let lastMessageText = 'No messages yet';
  if (room.lastMessage) {
    if (typeof room.lastMessage === 'object') {
      lastMessageText = room.lastMessage.content || '';
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

const ChatPage = () => {
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    // Modal states
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [newGroupOpen, setNewGroupOpen] = useState(false);
    
    // User search states
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    // Group creation states
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    const roomRef = useRef(room);
    useEffect(() => {
        roomRef.current = room;
    }, [room]);

    // Check auth on mount
    useEffect(() => {
        const token = localStorage.getItem("x-token");
        const userObj = JSON.parse(localStorage.getItem("user") || "null");

        if (!token || !userObj) {
            localStorage.removeItem("x-token");
            localStorage.removeItem("user");
            navigate('/auth');
            return;
        }

        setCurrentUser(userObj);

        // Configure and connect socket
        socket.auth = { token };
        socket.connect();

        // Socket listeners
        socket.on("connect", () => {
            console.log("Socket connected");
        });

        socket.on("receiveMessage", (newMessage) => {
            // Append message to active room if matches
            if (newMessage.roomId === roomRef.current?._id) {
                setMessages((prev) => {
                    if (prev.some(m => m._id === newMessage._id)) return prev;
                    return [...prev, newMessage];
                });
            }

            // Update sidebar room list last message
            setRooms((prevRooms) =>
                prevRooms.map((r) => {
                    if (r._id === newMessage.roomId) {
                        return {
                            ...r,
                            lastMessage: newMessage.content || 'Attachment',
                            isNew: roomRef.current?._id !== r._id
                        };
                    }
                    return r;
                })
            );
        });

        return () => {
            socket.off("connect");
            socket.off("receiveMessage");
            socket.disconnect();
        };
    }, [navigate]);

    // Fetch rooms list
    const fetchRooms = async (currentUserObj) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/my-rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const mapped = response.data.data.map(r => mapRoom(r, currentUserObj));
                setRooms(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchRooms(currentUser);
        }
    }, [currentUser]);

    // Fetch messages when room changes
    useEffect(() => {
        if (room?._id) {
            // Join socket room
            socket.emit("joinRoom", room._id);

            // Fetch room messages
            const fetchMessages = async () => {
                try {
                    const token = localStorage.getItem("x-token");
                    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/get-messages/${room._id}`, {
                        page: 1,
                        limit: 100
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.status === 200) {
                        // Reverse messages because backend returns newest first
                        const msgs = response.data.data.result.reverse();
                        setMessages(msgs);

                        // Clear new badge
                        setRooms(prev => prev.map(r => r._id === room._id ? { ...r, isNew: false } : r));
                    }
                } catch (error) {
                    console.error("Failed to fetch messages:", error);
                }
            };

            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [room]);

    // Handle send message
    const handleSend = async (msg) => {
        if (!room || !currentUser) return;
        const token = localStorage.getItem("x-token");

        if (msg.attachments && msg.attachments.length > 0) {
            // Handle sending file attachment via REST API
            const formData = new FormData();
            formData.append("roomId", room._id);
            formData.append("sender", currentUser._id);
            formData.append("content", msg.text || "");
            msg.attachments.forEach(att => {
                formData.append("files", att.file);
            });

            try {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/send-message`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                // Message will be handled on receiveMessage socket event
            } catch (error) {
                console.error("Failed to send message with attachment:", error);
            }
        } else {
            // Send text message directly over socket
            const messageData = {
                roomId: room._id,
                sender: currentUser._id,
                content: msg.text
            };
            socket.emit("sendMessage", messageData);
        }
    };

    // User search function
    useEffect(() => {
        if (!userSearchQuery.trim()) {
            setFoundUsers([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setSearchingUsers(true);
            try {
                const token = localStorage.getItem("x-token");
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/search?q=${userSearchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    // Filter out current user from search result
                    const filtered = response.data.data.filter(u => u._id !== currentUser?._id);
                    setFoundUsers(filtered);
                }
            } catch (error) {
                console.error("Failed to search users:", error);
            } finally {
                setSearchingUsers(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [userSearchQuery, currentUser]);

    // Start private chat
    const handleStartPrivateChat = async (selectedUser) => {
        // 1. Check if room already exists locally
        const existing = rooms.find(r => 
            r.roomType === 'private' && 
            r.members?.some(m => m._id === selectedUser._id)
        );

        if (existing) {
            setRoom(existing);
            setNewChatOpen(false);
            setUserSearchQuery('');
            return;
        }

        // 2. Call API to create private room
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/create-room`, {
                roomName: `${selectedUser.firstName} & ${currentUser.firstName}`,
                roomType: 'private',
                members: [currentUser._id, selectedUser._id]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                // Fetch rooms list again and select the created room
                await fetchRooms(currentUser);
                setNewChatOpen(false);
                setUserSearchQuery('');
            }
        } catch (error) {
            console.error("Failed to create room:", error);
            alert("Could not start chat. Please try again.");
        }
    };

    // Create group room
    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            alert("Please enter a group name");
            return;
        }
        if (selectedMembers.length < 1) {
            alert("Please select at least 1 member to add");
            return;
        }

        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/create-room`, {
                roomName: groupName,
                roomType: 'group',
                members: [currentUser._id, ...selectedMembers]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                await fetchRooms(currentUser);
                setNewGroupOpen(false);
                setGroupName('');
                setSelectedMembers([]);
                setUserSearchQuery('');
            }
        } catch (error) {
            console.error("Failed to create group:", error);
            alert("Could not create group. Please try again.");
        }
    };

    const handleToggleMember = (userId) => {
        setSelectedMembers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <MainLayout>
            <Box sx={{ maxWidth: '100vw', display: 'flex', flexDirection: 'row', maxHeight: '100%', marginLeft: '1px', position: 'fixed', p: 1, mx:0, gap: 2 }}>
                <ConversationsList 
                    rooms={rooms} 
                    setRoom={setRoom} 
                    currentUser={currentUser}
                    onNewChatClick={() => setNewChatOpen(true)}
                    onNewGroupClick={() => setNewGroupOpen(true)}
                />
                <ChatWindow 
                    messages={messages} 
                    room={room} 
                    currentUserId={currentUser?._id} 
                    setRoom={setRoom}
                    onSend={handleSend}
                />
            </Box>

            {/* Start New Private Chat Dialog */}
            <Dialog open={newChatOpen} onClose={() => { setNewChatOpen(false); setUserSearchQuery(''); }} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#222', color: '#fff', borderRadius: '15px', border: '1px solid #444' } }}>
                <DialogTitle sx={{ borderBottom: '1px solid #333' }}>Start New Chat</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by name or email..."
                        variant="outlined"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        sx={{
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                                '& input': { color: 'white' },
                                '& fieldset': { borderColor: '#555' },
                                '&:hover fieldset': { borderColor: '#888' },
                                '&.Mui-focused fieldset': { borderColor: '#0af' },
                            }
                        }}
                    />
                    {searchingUsers && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 2, color: '#0af' }} />}
                    <List sx={{ mt: 1, maxHeight: '250px', overflowY: 'auto' }}>
                        {foundUsers.map(user => (
                            <ListItem button key={user._id} onClick={() => handleStartPrivateChat(user)} sx={{ '&:hover': { bgcolor: '#333' }, borderRadius: '8px', mb: 0.5 }}>
                                <ListItemAvatar>
                                    <Avatar src={user.profilePicture}>{user.firstName[0]}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} secondaryTypographyProps={{ sx: { color: '#aaa' } }} />
                            </ListItem>
                        ))}
                        {!searchingUsers && userSearchQuery.trim() && foundUsers.length === 0 && (
                            <Typography sx={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', mt: 2 }}>No users found</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #333', p: 1.5 }}>
                    <Button onClick={() => { setNewChatOpen(false); setUserSearchQuery(''); }} sx={{ color: '#aaa' }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Create New Group Room Dialog */}
            <Dialog open={newGroupOpen} onClose={() => { setNewGroupOpen(false); setGroupName(''); setSelectedMembers([]); setUserSearchQuery(''); }} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#222', color: '#fff', borderRadius: '15px', border: '1px solid #444' } }}>
                <DialogTitle sx={{ borderBottom: '1px solid #333' }}>Create Group Chat</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        label="Group Name"
                        variant="outlined"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        slotProps={{ inputLabel: { style: { color: '#aaa' } } }}
                        sx={{
                            mt: 1,
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                '& input': { color: 'white' },
                                '& fieldset': { borderColor: '#555' },
                                '&:hover fieldset': { borderColor: '#888' },
                                '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        placeholder="Search members..."
                        variant="outlined"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        sx={{
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                                '& input': { color: 'white' },
                                '& fieldset': { borderColor: '#555' },
                                '&:hover fieldset': { borderColor: '#888' },
                                '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                            }
                        }}
                    />
                    {searchingUsers && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 1, color: '#a3f96d' }} />}
                    <List sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {foundUsers.map(user => (
                            <ListItem button key={user._id} onClick={() => handleToggleMember(user._id)} sx={{ '&:hover': { bgcolor: '#333' }, borderRadius: '8px', mb: 0.5 }}>
                                <Checkbox checked={selectedMembers.includes(user._id)} sx={{ color: '#555', '&.Mui-checked': { color: '#a3f96d' } }} />
                                <ListItemAvatar>
                                    <Avatar src={user.profilePicture}>{user.firstName[0]}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} secondaryTypographyProps={{ sx: { color: '#aaa' } }} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #333', p: 1.5 }}>
                    <Button onClick={() => { setNewGroupOpen(false); setGroupName(''); setSelectedMembers([]); setUserSearchQuery(''); }} sx={{ color: '#aaa' }}>Cancel</Button>
                    <Button onClick={handleCreateGroup} variant="contained" color="success" sx={{ textTransform: 'none', bgcolor: '#a3f96d', color: '#000', '&:hover': { bgcolor: '#8ee05c' } }}>Create Group</Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

export default ChatPage;

