import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import axios from 'axios';

const JoinRoom = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading | success | error | login
    const [message, setMessage] = useState('');
    const [roomName, setRoomName] = useState('');

    useEffect(() => {
        const token = localStorage.getItem("x-token");
        if (!token) {
            setStatus('login');
            setMessage('You need to log in first to join this group.');
            return;
        }

        const joinGroup = async () => {
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/join/${inviteCode}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (response.status === 200) {
                    setStatus('success');
                    setMessage(response.data.message);
                    setRoomName(response.data.data?.roomName || 'the group');
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Invalid or expired invite link.');
            }
        };

        joinGroup();
    }, [inviteCode]);

    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#111',
            color: '#fff',
            gap: 3,
            px: 2
        }}>
            {status === 'loading' && (
                <>
                    <CircularProgress sx={{ color: '#0af' }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Joining group...
                    </Typography>
                </>
            )}

            {status === 'success' && (
                <>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f0' }}>
                        ✓
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {message}
                    </Typography>
                    <Typography sx={{ color: '#aaa' }}>
                        You are now a member of <strong style={{ color: '#fff' }}>{roomName}</strong>
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/chat')}
                        sx={{
                            mt: 2,
                            bgcolor: '#0af',
                            color: '#000',
                            fontWeight: 'bold',
                            borderRadius: '10px',
                            px: 4,
                            py: 1.5,
                            '&:hover': { bgcolor: '#09e' }
                        }}
                    >
                        Go to Chat
                    </Button>
                </>
            )}

            {status === 'error' && (
                <>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44' }}>
                        ✕
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Unable to Join
                    </Typography>
                    <Typography sx={{ color: '#aaa' }}>
                        {message}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/chat')}
                        sx={{
                            mt: 2,
                            color: '#fff',
                            borderColor: '#555',
                            borderRadius: '10px',
                            px: 4,
                            py: 1.5,
                            '&:hover': { borderColor: '#888' }
                        }}
                    >
                        Go to Chat
                    </Button>
                </>
            )}

            {status === 'login' && (
                <>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffa500' }}>
                        🔒
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Login Required
                    </Typography>
                    <Typography sx={{ color: '#aaa' }}>
                        {message}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate(`/auth?redirect=/join/${inviteCode}`)}
                        sx={{
                            mt: 2,
                            bgcolor: '#0af',
                            color: '#000',
                            fontWeight: 'bold',
                            borderRadius: '10px',
                            px: 4,
                            py: 1.5,
                            '&:hover': { bgcolor: '#09e' }
                        }}
                    >
                        Login to Join
                    </Button>
                </>
            )}
        </Box>
    );
};

export default JoinRoom;
