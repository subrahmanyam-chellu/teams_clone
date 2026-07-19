import React from 'react';
import { Box, Toolbar, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import CallIcon from '@mui/icons-material/Call';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function VerticalAppBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = React.useState(0);

    const isChatActive = location.pathname === '/chat';
    const isTeamsActive = location.pathname === '/teams';
    const isNotificationsActive = location.pathname === '/notifications';

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

    return (
        <Box sx={{ display: {xs:'none', md:'flex'} }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '48px',
                    height: 'calc(100vh - 51px)',
                    bgcolor: '#1c34bb',
                    color: '#fff',
                    position: 'fixed',
                    top: '48px',
                    left: 0,
                    borderLeft:'1px solid white',
                    gap: 4,
                    mb:'1px'
                }}
            >
                <Toolbar sx={{ minHeight: '48px', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: 8, mt: 8 }}>
                    <Badge badgeContent={unreadCount} color="error" overlap="circular">
                        <NotificationsIcon 
                            onClick={() => navigate('/notifications')} 
                            sx={{ 
                                cursor: 'pointer',
                                color: isNotificationsActive ? '#a3f96d' : '#fff',
                                '&:hover': { color: '#a3f96d' }
                            }}
                        />
                    </Badge>
                    <ChatIcon 
                        onClick={() => navigate('/chat')} 
                        sx={{ 
                            cursor: 'pointer', 
                            color: isChatActive ? '#a3f96d' : '#fff',
                            '&:hover': { color: '#a3f96d' } 
                        }} 
                    />
                    <GroupIcon 
                        onClick={() => navigate('/teams')} 
                        sx={{ 
                            cursor: 'pointer', 
                            color: isTeamsActive ? '#a3f96d' : '#fff',
                            '&:hover': { color: '#a3f96d' } 
                        }} 
                    />
                    <CallIcon sx={{ cursor: 'pointer', '&:hover': { color: '#a3f96d' } }} />
                    <CalendarMonthIcon sx={{ cursor: 'pointer', '&:hover': { color: '#a3f96d' } }} />
                </Toolbar>
            </Box>
        </Box>
    );
}
