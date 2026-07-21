import React from 'react';
import { Box, Toolbar, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import CallIcon from '@mui/icons-material/Call';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import socket from './Socket';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export default function VerticalAppBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = React.useState(0);

    const isChatActive = location.pathname === '/chat';
    const isTeamsActive = location.pathname === '/teams';
    const isNotificationsActive = location.pathname === '/notifications';
    const isScheduleActive = location.pathname === '/schedule';
    const isAdminActive = location.pathname === '/admin';
    const [currentUser, setCurrentUser] = React.useState(null);

    React.useEffect(() => {
        const userObj = JSON.parse(localStorage.getItem("user") || "null");
        setCurrentUser(userObj);
    }, [location.pathname]);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem("x-token");
            if (!token) return;
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const unread = response.data.data?.filter(n => n.status === 'unread') || [];
                setUnreadCount(unread.length);
            }
        } catch (error) {
            console.error("Failed to fetch unread notifications count:", error);
        }
    };

    React.useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    React.useEffect(() => {
        const handleUpdate = () => {
            fetchUnreadCount();
        };
        window.addEventListener('notificationsUpdated', handleUpdate);
        
        if (socket) {
            socket.on("newNotification", handleUpdate);
        }

        return () => {
            window.removeEventListener('notificationsUpdated', handleUpdate);
            if (socket) {
                socket.off("newNotification", handleUpdate);
            }
        };
    }, []);

    return (
        <Box sx={{ display: {xs:'none', md:'flex'} }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '48px',
                    height: 'calc(100vh - 48px)',
                    background: 'linear-gradient(to bottom, rgba(28, 52, 187, 0.95), rgba(15, 18, 30, 0.98))',
                    backdropFilter: 'blur(20px)',
                    color: '#fff',
                    position: 'fixed',
                    top: '48px',
                    left: 0,
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    gap: 4
                }}
            >
                <Toolbar sx={{ minHeight: '48px', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: 6, mt: 5 }}>
                    <Badge badgeContent={unreadCount} color="error" overlap="circular">
                        <NotificationsIcon 
                            onClick={() => navigate('/notifications')} 
                            sx={{ 
                                cursor: 'pointer',
                                fontSize: '1.5rem',
                                color: isNotificationsActive ? '#a3f96d' : '#fff',
                                filter: isNotificationsActive ? 'drop-shadow(0 0 8px rgba(163, 249, 109, 0.6))' : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                    color: '#a3f96d',
                                    transform: 'scale(1.18)',
                                    filter: 'drop-shadow(0 0 10px rgba(163, 249, 109, 0.8))'
                                }
                            }}
                        />
                    </Badge>
                    <ChatIcon 
                        onClick={() => navigate('/chat')} 
                        sx={{ 
                            cursor: 'pointer', 
                            fontSize: '1.5rem',
                            color: isChatActive ? '#a3f96d' : '#fff',
                            filter: isChatActive ? 'drop-shadow(0 0 8px rgba(163, 249, 109, 0.6))' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                                color: '#a3f96d',
                                transform: 'scale(1.18)',
                                filter: 'drop-shadow(0 0 10px rgba(163, 249, 109, 0.8))'
                            }
                        }} 
                    />
                    <GroupIcon 
                        onClick={() => navigate('/teams')} 
                        sx={{ 
                            cursor: 'pointer', 
                            fontSize: '1.5rem',
                            color: isTeamsActive ? '#a3f96d' : '#fff',
                            filter: isTeamsActive ? 'drop-shadow(0 0 8px rgba(163, 249, 109, 0.6))' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                                color: '#a3f96d',
                                transform: 'scale(1.18)',
                                filter: 'drop-shadow(0 0 10px rgba(163, 249, 109, 0.8))'
                            }
                        }} 
                    />
                    <CalendarMonthIcon 
                        onClick={() => navigate('/schedule')}
                        sx={{ 
                            cursor: 'pointer', 
                            fontSize: '1.5rem',
                            color: isScheduleActive ? '#a3f96d' : '#fff',
                            filter: isScheduleActive ? 'drop-shadow(0 0 8px rgba(163, 249, 109, 0.6))' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { 
                                color: '#a3f96d',
                                transform: 'scale(1.18)',
                                filter: 'drop-shadow(0 0 10px rgba(163, 249, 109, 0.8))'
                            }
                        }} 
                    />
                    {currentUser?.role === 'SUPER_ADMIN' && (
                        <AdminPanelSettingsIcon 
                            onClick={() => navigate('/admin')}
                            sx={{ 
                                cursor: 'pointer', 
                                fontSize: '1.5rem',
                                color: isAdminActive ? '#a3f96d' : '#fff',
                                filter: isAdminActive ? 'drop-shadow(0 0 8px rgba(163, 249, 109, 0.6))' : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                    color: '#a3f96d',
                                    transform: 'scale(1.18)',
                                    filter: 'drop-shadow(0 0 10px rgba(163, 249, 109, 0.8))'
                                }
                            }} 
                        />
                    )}
                </Toolbar>
            </Box>
        </Box>
    );
}
