import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemAvatar, ListItemText, Checkbox, Button, Avatar, CircularProgress } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import ChatWindow from '../../components/ChatWindow';
import ConversationsList from '../../components/ConversationsList';
import socket from '../../components/Socket';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

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

        return () => {
            socket.off("connect");
            socket.disconnect();
        };
    }, [navigate]);

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
                triggerRefresh();
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
                triggerRefresh();
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
                    setRoom={setRoom} 
                    activeRoomId={room?._id}
                    refreshTrigger={refreshTrigger}
                />
                <ChatWindow 
                    room={room} 
                    currentUserId={currentUser?._id} 
                    setRoom={setRoom}
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
