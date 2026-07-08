import React from 'react';
import { Box, Toolbar, IconButton, Typography, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import CallIcon from '@mui/icons-material/Call';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';

export default function VerticalAppBar() {
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
                    <NotificationsIcon sx={{color:'#a3f96d'}}/>
                    <ChatIcon />
                    <GroupIcon />
                    <CallIcon />
                    <CalendarMonthIcon />
                </Toolbar>
            </Box>
        </Box>
    );
}
