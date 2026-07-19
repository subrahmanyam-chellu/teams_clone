import React from 'react';
import { Box, Toolbar } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import CallIcon from '@mui/icons-material/Call';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate, useLocation } from 'react-router-dom';

export default function VerticalAppBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isChatActive = location.pathname === '/chat';
    const isTeamsActive = location.pathname === '/teams';

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
                    <NotificationsIcon sx={{color:'#a3f96d', cursor: 'pointer'}}/>
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
                    <CallIcon sx={{ cursor: 'pointer' }} />
                    <CalendarMonthIcon sx={{ cursor: 'pointer' }} />
                </Toolbar>
            </Box>
        </Box>
    );
}
