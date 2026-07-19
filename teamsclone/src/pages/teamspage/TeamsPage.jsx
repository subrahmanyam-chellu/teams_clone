import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemAvatar, ListItemText, Checkbox, Button, Avatar, CircularProgress } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import ChatWindow from '../../components/ChatWindow';
import ConversationsList from '../../components/ConversationsList';
import socket from '../../components/Socket';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TeamsPage = () => {
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modal state for group creation
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
            console.log("TeamsPage: Socket connected");
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
                
                // Auto-select the newly created group chat
                const createdRoom = response.data.data;
                if (createdRoom) {
                    setRoom({
                        ...createdRoom,
                        name: createdRoom.roomName,
                        profilePic: createdRoom.roomProfile || '',
                        lastMessage: 'No messages yet'
                    });
                }
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
                    onNewGroupClick={() => setNewGroupOpen(true)}
                    isTeamsPage={true}
                />
                <ChatWindow 
                    room={room} 
                    currentUserId={currentUser?._id} 
                    setRoom={setRoom}
                />
            </Box>

            {/* Create New Group Room Dialog */}
            <Dialog open={newGroupOpen} onClose={() => { setNewGroupOpen(false); setGroupName(''); setSelectedMembers([]); setUserSearchQuery(''); }} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } } }}>
                <DialogTitle sx={{ borderBottom: '1px solid #444', fontWeight: 'bold', color: '#fff', bgcolor: '#1c34bb' }}>Create Group Chat</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        label="Group Name"
                        variant="outlined"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        slotProps={{ inputLabel: { style: { color: '#bbb' } } }}
                        sx={{
                            mt: 1,
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                '& input': { color: '#f0f0f0' },
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
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
                                '& input': { color: '#f0f0f0' },
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                            },
                            '& .MuiInputBase-input::placeholder': { color: '#aaa', opacity: 1 }
                        }}
                    />
                    {searchingUsers && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 1, color: '#a3f96d' }} />}
                    <List sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {foundUsers.map(user => (
                            <ListItem button key={user._id} onClick={() => handleToggleMember(user._id)} sx={{ '&:hover': { bgcolor: '#2A2A2A' }, borderRadius: '8px', mb: 0.5 }}>
                                <Checkbox checked={selectedMembers.includes(user._id)} sx={{ color: '#555', '&.Mui-checked': { color: '#a3f96d' } }} />
                                <ListItemAvatar>
                                    <Avatar src={user.profilePicture}>{user.firstName ? user.firstName[0] : ''}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={user.email} slotProps={{ primary: { sx: { color: '#f0f0f0' } }, secondary: { sx: { color: '#fff' } } }} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions sx={{ borderTop: '1px solid #444', p: 1.5 }}>
                    <Button onClick={() => { setNewGroupOpen(false); setGroupName(''); setSelectedMembers([]); setUserSearchQuery(''); }} sx={{ color: '#ccc', '&:hover': { color: '#fff', bgcolor: '#2A2A2A' } }}>Cancel</Button>
                    <Button onClick={handleCreateGroup} variant="contained" sx={{ textTransform: 'none', bgcolor: '#a3f96d', color: '#000', fontWeight: 'bold', '&:hover': { bgcolor: '#8ee05c' } }}>Create Group</Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

export default TeamsPage;
