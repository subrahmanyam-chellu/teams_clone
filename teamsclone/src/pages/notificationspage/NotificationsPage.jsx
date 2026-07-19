import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Avatar, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Tooltip } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch user on mount
    useEffect(() => {
        const userObj = JSON.parse(localStorage.getItem("user") || "null");
        if (!userObj) {
            navigate('/auth');
            return;
        }
        setCurrentUser(userObj);
    }, [navigate]);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("x-token");
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                setNotifications(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
        }
    }, [currentUser]);

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                // Update local state to read
                setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications?")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                setNotifications([]);
            }
        } catch (error) {
            console.error("Failed to clear notifications:", error);
        }
    };

    const handleNotificationClick = async (notif) => {
        try {
            const token = localStorage.getItem("x-token");
            
            // If it is unread, mark it as read in backend
            if (notif.status === 'unread') {
                await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications/read/${notif._id}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            const roomId = notif.roomId?._id || notif.roomId;
            const roomType = notif.roomId?.roomType;

            // Navigate to the correct page and pass selectRoomId state
            if (roomType === 'group') {
                navigate('/teams', { state: { selectRoomId: roomId } });
            } else {
                navigate('/chat', { state: { selectRoomId: roomId } });
            }
        } catch (error) {
            console.error("Failed to process notification click:", error);
        }
    };

    return (
        <MainLayout>
            <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto', p: 3, height: 'calc(100vh - 67px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        Offline Notifications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        {notifications.some(n => n.status === 'unread') && (
                            <Button 
                                variant="outlined" 
                                startIcon={<DoneAllIcon />}
                                onClick={handleMarkAllAsRead}
                                sx={{ 
                                    textTransform: 'none', 
                                    color: '#a3f96d', 
                                    borderColor: '#a3f96d',
                                    '&:hover': { bgcolor: 'rgba(163, 249, 109, 0.1)', borderColor: '#a3f96d' }
                                }}
                            >
                                Mark all as read
                            </Button>
                        )}
                        {notifications.length > 0 && (
                            <Button 
                                variant="outlined" 
                                startIcon={<DeleteIcon />}
                                onClick={handleClearAll}
                                sx={{ 
                                    textTransform: 'none', 
                                    color: '#ff4444', 
                                    borderColor: '#ff4444',
                                    '&:hover': { bgcolor: 'rgba(255, 68, 68, 0.1)', borderColor: '#ff4444' }
                                }}
                            >
                                Clear All
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                    {loading ? (
                        <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5, color: '#a3f96d' }} />
                    ) : notifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 10, color: '#888' }}>
                            <Typography variant="h6">All caught up!</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>No unread offline notifications available.</Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {notifications.map((notif) => {
                                const isUnread = notif.status === 'unread';
                                const sender = notif.messageId?.sender;
                                const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : 'Someone';
                                const content = notif.messageId?.content || (notif.messageId?.mediaUrl && notif.messageId.mediaUrl.length > 0 ? 'sent an attachment' : 'sent a message');
                                const room = notif.roomId;
                                const isGroup = room?.roomType === 'group';

                                // Card Title & Text
                                const notificationTitle = isGroup ? room.roomName : senderName;
                                const notificationSub = isGroup 
                                    ? `${senderName} posted: "${content}"`
                                    : `sent you a message: "${content}"`;

                                // Card Avatar
                                const avatarSrc = isGroup ? room.roomProfile : (sender?.profilePicture || '');
                                const avatarInitials = isGroup ? (room.roomName ? room.roomName[0] : 'G') : (senderName ? senderName[0] : 'U');

                                return (
                                    <Card 
                                        key={notif._id}
                                        onClick={() => handleNotificationClick(notif)}
                                        sx={{ 
                                            mb: 2, 
                                            bgcolor: isUnread ? '#25293c' : '#2A2A2A', 
                                            border: isUnread ? '1px solid #1c34bb' : '1px solid #444',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            borderRadius: '12px',
                                            '&:hover': { 
                                                bgcolor: isUnread ? '#2b3149' : '#333',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: '16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar 
                                                src={avatarSrc} 
                                                sx={{ 
                                                    width: 48, 
                                                    height: 48, 
                                                    bgcolor: isGroup ? '#1c34bb' : '#555',
                                                    color: '#fff',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {avatarInitials}
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                                    <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {notificationTitle}
                                                    </Typography>
                                                    <Typography sx={{ color: '#aaa', fontSize: '0.75rem', ml: 1, flexShrink: 0 }}>
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ color: isUnread ? '#fff' : '#ccc', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {notificationSub}
                                                </Typography>
                                            </Box>
                                            {isUnread && (
                                                <Box 
                                                    sx={{ 
                                                        width: 10, 
                                                        height: 10, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#a3f96d', 
                                                        flexShrink: 0 
                                                    }} 
                                                />
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </List>
                    )}
                </Box>
            </Box>
        </MainLayout>
    );
};

export default NotificationsPage;
