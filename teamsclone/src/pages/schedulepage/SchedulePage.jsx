import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Avatar, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, InputAdornment } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import socket from '../../components/Socket';

const SchedulePage = () => {
    const navigate = useNavigate();
    const handleDateIconClick = (id) => {
        const input = document.getElementById(id);
        if (input && typeof input.showPicker === 'function') {
            input.showPicker();
        }
    };
    const [meetings, setMeetings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    // Schedule Dialog states
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [newRoomId, setNewRoomId] = useState('');
    const [scheduling, setScheduling] = useState(false);

    // Call Active states
    const [callActive, setCallActive] = useState(false);
    const [activeMeetingRoom, setActiveMeetingRoom] = useState(null);

    // Calendar state
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Fetch user on mount
    useEffect(() => {
        const userObj = JSON.parse(localStorage.getItem("user") || "null");
        if (!userObj) {
            navigate('/auth');
            return;
        }
        setCurrentUser(userObj);
    }, [navigate]);

    // Initialize schedule dates when dialog opens
    useEffect(() => {
        if (scheduleDialogOpen) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            const nextHourTime = new Date(now.getTime() + 60 * 60 * 1000);
            const nextYear = nextHourTime.getFullYear();
            const nextMonth = String(nextHourTime.getMonth() + 1).padStart(2, '0');
            const nextDay = String(nextHourTime.getDate()).padStart(2, '0');
            const nextHours = String(nextHourTime.getHours()).padStart(2, '0');
            const nextMinutes = String(nextHourTime.getMinutes()).padStart(2, '0');

            setNewStartDate(`${year}-${month}-${day}`);
            setNewStartTime(`${hours}:${minutes}`);
            setNewEndDate(`${nextYear}-${nextMonth}-${nextDay}`);
            setNewEndTime(`${nextMinutes !== nextHours ? `${nextHours}:${nextMinutes}` : '00:00'}`);
        }
    }, [scheduleDialogOpen]);

    // Fetch meetings and rooms
    const fetchMeetings = async () => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings/my-meetings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                setMeetings(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch meetings:", error);
        }
    };

    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/my-rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                // Map names for display consistency
                const mapped = response.data.data.map(room => {
                    const isGroup = room.roomType === 'group';
                    const userObj = JSON.parse(localStorage.getItem("user") || "null");
                    const otherMember = !isGroup ? room.members?.find(m => {
                        if (!m) return false;
                        const memberId = m._id?.toString() || m?.toString();
                        const currentId = userObj?._id?.toString() || userObj?.id?.toString();
                        return memberId !== currentId;
                    }) : null;
                    const name = isGroup ? room.roomName : (otherMember ? `${otherMember.firstName} ${otherMember.lastName}` : room.roomName || 'Direct Message');
                    return { ...room, displayName: name };
                });
                setRooms(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            setLoading(true);
            Promise.all([fetchMeetings(), fetchRooms()]).finally(() => setLoading(false));
        }
    }, [currentUser]);

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        const startISO = `${newStartDate}T${newStartTime}`;
        const endISO = `${newEndDate}T${newEndTime}`;

        if (!newTitle.trim() || !newStartDate || !newStartTime || !newEndDate || !newEndTime || !newRoomId) {
            alert("Please fill in all required fields.");
            return;
        }

        if (new Date(startISO) >= new Date(endISO)) {
            alert("Start time must be before end time.");
            return;
        }

        setScheduling(true);
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings`, {
                title: newTitle.trim(),
                description: newDescription.trim(),
                startTime: startISO,
                endTime: endISO,
                roomId: newRoomId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201) {
                alert("Meeting scheduled successfully!");
                setScheduleDialogOpen(false);
                setNewTitle('');
                setNewDescription('');
                setNewStartDate('');
                setNewStartTime('');
                setNewEndDate('');
                setNewEndTime('');
                setNewRoomId('');
                fetchMeetings();
            }
        } catch (error) {
            console.error("Failed to schedule meeting:", error);
            alert(error.response?.data?.message || "Could not schedule meeting. Please try again.");
        } finally {
            setScheduling(false);
        }
    };

    const handleCancelMeeting = async (meetingId) => {
        if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/meetings/${meetingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                alert("Meeting cancelled successfully!");
                setMeetings(prev => prev.filter(m => m._id !== meetingId));
            }
        } catch (error) {
            console.error("Failed to cancel meeting:", error);
            alert("Could not cancel meeting. Please try again.");
        }
    };

    const handleJoinMeeting = (meeting) => {
        const now = new Date();
        const startTime = new Date(meeting.startTime);
        const allowedTime = new Date(startTime.getTime() - 5 * 60 * 1000);

        if (now < allowedTime) {
            alert(`You can only join this meeting starting 5 minutes before the scheduled start time (${format(startTime, 'hh:mm a')}).`);
            return;
        }

        const roomObj = meeting.roomId;
        const hostName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Host";
        const callData = {
            roomId: roomObj._id,
            roomName: roomObj.roomName || roomObj.name || 'Room Call',
            hostName,
            roomType: roomObj.roomType,
            hostId: currentUser?._id
        };
        // Broadcast meeting call over socket
        socket.emit("startCall", callData);

        // Send silent call notification message for offline users
        const messageData = {
            roomId: roomObj._id,
            sender: currentUser?._id,
            content: `invited you to video call: "${meeting.title}"`,
            isCallMessage: true
        };
        socket.emit("sendMessage", messageData);
        
        setActiveMeetingRoom(roomObj);
        setCallActive(true);
    };

    // Filter meetings by selected date
    const filteredMeetings = meetings.filter(m => {
        return isSameDay(new Date(m.startTime), selectedDate);
    });

    const changeDate = (days) => {
        const nextDate = new Date(selectedDate);
        nextDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(nextDate);
    };

    return (
        <MainLayout>
            <Box sx={{ width: '100%', maxWidth: '800px', mx: 'auto', p: 3, height: 'calc(100vh - 67px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CalendarMonthIcon sx={{ color: '#a3f96d', fontSize: '2rem' }} />
                        Meeting Scheduler
                    </Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => setScheduleDialogOpen(true)}
                        sx={{ 
                            textTransform: 'none', 
                            bgcolor: '#a3f96d', 
                            color: '#000', 
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#8ee05c' }
                        }}
                    >
                        Schedule Meeting
                    </Button>
                </Box>

                {/* Calendar Navigation Bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#2A2A2A', p: 1.5, borderRadius: '12px', mb: 3, border: '1px solid #444', flexShrink: 0 }}>
                    <IconButton onClick={() => changeDate(-1)} sx={{ color: '#fff', '&:hover': { bgcolor: '#444' } }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box 
                        onClick={() => {
                            const picker = document.getElementById('dayBarDatePicker');
                            if (picker && typeof picker.showPicker === 'function') picker.showPicker();
                        }}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    >
                        <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <IconButton 
                            size="small"
                            sx={{ color: '#a3f96d', p: 0.5 }}
                            title="Choose Date"
                        >
                            <CalendarMonthIcon />
                        </IconButton>
                        <input
                            id="dayBarDatePicker"
                            type="date"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setSelectedDate(new Date(e.target.value));
                                }
                            }}
                            style={{
                                position: 'absolute',
                                visibility: 'hidden',
                                width: 0,
                                height: 0
                            }}
                        />
                    </Box>
                    <IconButton onClick={() => changeDate(1)} sx={{ color: '#fff', '&:hover': { bgcolor: '#444' } }}>
                        <ArrowForwardIcon />
                    </IconButton>
                </Box>

                {/* Meetings List */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                    {loading ? (
                        <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 5, color: '#a3f96d' }} />
                    ) : filteredMeetings.length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 8, color: '#888' }}>
                            <Typography variant="h6">No meetings scheduled for this day</Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>Use the button above to schedule a new video call.</Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {filteredMeetings.map((meeting) => {
                                const isHost = meeting.hostId?._id?.toString() === currentUser?._id?.toString();
                                const roomName = meeting.roomId?.roomName || meeting.roomId?.name || 'Group Chat';
                                const hostName = meeting.hostId ? `${meeting.hostId.firstName} ${meeting.hostId.lastName}` : 'Someone';

                                return (
                                    <Card 
                                        key={meeting._id}
                                        sx={{ 
                                            mb: 2, 
                                            bgcolor: '#2A2A2A', 
                                            border: '1px solid #444',
                                            borderRadius: '12px',
                                            transition: 'all 0.2s',
                                            '&:hover': { 
                                                bgcolor: '#333',
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ p: '16px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                        {meeting.title}
                                                    </Typography>
                                                    {meeting.description && (
                                                        <Typography sx={{ color: '#aaa', fontSize: '0.9rem', mt: 0.5 }}>
                                                            {meeting.description}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={<VideocamIcon />}
                                                        onClick={() => handleJoinMeeting(meeting)}
                                                        sx={{
                                                            bgcolor: '#a3f96d',
                                                            color: '#000',
                                                            fontWeight: 'bold',
                                                            textTransform: 'none',
                                                            fontSize: '0.85rem',
                                                            '&:hover': { bgcolor: '#8ee05c' }
                                                        }}
                                                    >
                                                        Join
                                                    </Button>
                                                    {(isHost || currentUser?.role === 'ADMIN') && (
                                                        <IconButton 
                                                            onClick={() => handleCancelMeeting(meeting._id)}
                                                            sx={{ color: '#ff4444', '&:hover': { bgcolor: 'rgba(255, 68, 68, 0.1)' } }}
                                                            title="Cancel Meeting"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, pt: 1, borderTop: '1px solid #444' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>Time</Typography>
                                                    <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                        {format(new Date(meeting.startTime), 'hh:mm a')} - {format(new Date(meeting.endTime), 'hh:mm a')}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>Room / Group</Typography>
                                                    <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                        {roomName}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#aaa', display: 'block' }}>Organizer</Typography>
                                                    <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                        {isHost ? 'Me' : hostName}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </List>
                    )}
                </Box>
            </Box>

            {/* Schedule Meeting Dialog */}
            <Dialog 
                open={scheduleDialogOpen} 
                onClose={() => setScheduleDialogOpen(false)} 
                fullWidth 
                maxWidth="sm" 
                slotProps={{
                    paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } }
                }}
            >
                <form onSubmit={handleScheduleSubmit}>
                    <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Schedule New Meeting</Typography>
                        <IconButton size="small" onClick={() => setScheduleDialogOpen(false)} sx={{ color: '#fff' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField
                            fullWidth
                            required
                            label="Meeting Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& input': { color: '#f0f0f0' },
                                    '& fieldset': { borderColor: '#444' },
                                    '&:hover fieldset': { borderColor: '#666' },
                                    '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                },
                                '& .MuiInputLabel-root': { color: '#aaa' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                            }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& textarea': { color: '#f0f0f0' },
                                    '& fieldset': { borderColor: '#444' },
                                    '&:hover fieldset': { borderColor: '#666' },
                                    '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                },
                                '& .MuiInputLabel-root': { color: '#aaa' },
                                '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                            }}
                        />
                        <FormControl fullWidth required sx={{
                            '& .MuiOutlinedInput-root': {
                                '& .MuiSelect-select': { color: '#f0f0f0' },
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                            },
                            '& .MuiInputLabel-root': { color: '#aaa' },
                            '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                        }}>
                            <InputLabel>Select Room / Group</InputLabel>
                            <Select
                                value={newRoomId}
                                label="Select Room / Group"
                                onChange={(e) => setNewRoomId(e.target.value)}
                            >
                                {rooms.map(room => (
                                    <MenuItem key={room._id} value={room._id}>
                                        {room.displayName} ({room.roomType === 'group' ? 'Group' : 'Private'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Start Date & Time */}
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                id="newStartDateInput"
                                fullWidth
                                required
                                label="Start Date"
                                type="date"
                                value={newStartDate}
                                onChange={(e) => setNewStartDate(e.target.value)}
                                onClick={() => handleDateIconClick('newStartDateInput')}
                                slotProps={{ inputLabel: { shrink: true } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => handleDateIconClick('newStartDateInput')} size="small" sx={{ color: '#a3f96d', p: 0.5 }}>
                                                <CalendarMonthIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& input': { color: '#f0f0f0' },
                                        '& input::-webkit-calendar-picker-indicator': { display: 'none', WebkitAppearance: 'none' },
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#666' },
                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#aaa' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                                }}
                            />
                            <TextField
                                id="newStartTimeInput"
                                fullWidth
                                required
                                label="Start Time"
                                type="time"
                                value={newStartTime}
                                onChange={(e) => setNewStartTime(e.target.value)}
                                onClick={() => handleDateIconClick('newStartTimeInput')}
                                slotProps={{ inputLabel: { shrink: true } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => handleDateIconClick('newStartTimeInput')} size="small" sx={{ color: '#a3f96d', p: 0.5 }}>
                                                <AccessTimeIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& input': { color: '#f0f0f0' },
                                        '& input::-webkit-calendar-picker-indicator': { display: 'none', WebkitAppearance: 'none' },
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#666' },
                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#aaa' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                                }}
                            />
                        </Box>

                        {/* End Date & Time */}
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <TextField
                                id="newEndDateInput"
                                fullWidth
                                required
                                label="End Date"
                                type="date"
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                onClick={() => handleDateIconClick('newEndDateInput')}
                                slotProps={{ inputLabel: { shrink: true } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => handleDateIconClick('newEndDateInput')} size="small" sx={{ color: '#a3f96d', p: 0.5 }}>
                                                <CalendarMonthIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& input': { color: '#f0f0f0' },
                                        '& input::-webkit-calendar-picker-indicator': { display: 'none', WebkitAppearance: 'none' },
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#666' },
                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#aaa' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                                }}
                            />
                            <TextField
                                id="newEndTimeInput"
                                fullWidth
                                required
                                label="End Time"
                                type="time"
                                value={newEndTime}
                                onChange={(e) => setNewEndTime(e.target.value)}
                                onClick={() => handleDateIconClick('newEndTimeInput')}
                                slotProps={{ inputLabel: { shrink: true } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => handleDateIconClick('newEndTimeInput')} size="small" sx={{ color: '#a3f96d', p: 0.5 }}>
                                                <AccessTimeIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& input': { color: '#f0f0f0' },
                                        '& input::-webkit-calendar-picker-indicator': { display: 'none', WebkitAppearance: 'none' },
                                        '& fieldset': { borderColor: '#444' },
                                        '&:hover fieldset': { borderColor: '#666' },
                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                    },
                                    '& .MuiInputLabel-root': { color: '#aaa' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, borderTop: '1px solid #444', gap: 1.5 }}>
                        <Button 
                            onClick={() => setScheduleDialogOpen(false)}
                            sx={{ color: '#ccc', textTransform: 'none', fontWeight: 'bold' }}
                            disabled={scheduling}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit"
                            variant="contained"
                            disabled={scheduling}
                            sx={{ 
                                bgcolor: '#a3f96d', 
                                color: '#000', 
                                fontWeight: 'bold', 
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#8ee05c' }
                            }}
                        >
                            {scheduling ? 'Scheduling...' : 'Schedule'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Jitsi Meet Video Call Dialog */}
            <Dialog
                open={callActive}
                onClose={() => {}} 
                fullScreen
                slotProps={{
                    paper: { sx: { bgcolor: '#1A1A1A', color: '#fff' } }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            bgcolor: '#2A2A2A',
                            borderBottom: '1px solid #444',
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
                            Video Call: {activeMeetingRoom?.roomName || activeMeetingRoom?.name || 'Active Call'}
                        </Typography>
                        {(() => {
                             const canEndCall = activeMeetingRoom?.roomType === 'private' || currentUser?.role === 'ADMIN';
                             return (
                                 <Button
                                     variant="contained"
                                     sx={{
                                         bgcolor: '#ff4444',
                                         color: '#fff',
                                         fontWeight: 'bold',
                                         '&:hover': { bgcolor: '#cc3333' },
                                     }}
                                     onClick={() => {
                                         if (canEndCall && activeMeetingRoom?._id) {
                                             socket.emit("endCall", { roomId: activeMeetingRoom._id });
                                         }
                                         setCallActive(false);
                                         setActiveMeetingRoom(null);
                                     }}
                                 >
                                     {canEndCall ? 'End Call' : 'Leave Call'}
                                 </Button>
                             );
                         })()}
                    </Box>
                    <Box sx={{ flexGrow: 1, bgcolor: '#1A1A1A' }}>
                        {activeMeetingRoom && (
                            <iframe
                                src={`https://meet.jit.si/teamsclone-${activeMeetingRoom._id}#userInfo.displayName="${currentUser?.firstName || ''} ${currentUser?.lastName || ''}"&config.prejoinPageEnabled=false&config.defaultLanguage="en"`}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                allow="camera; microphone; fullscreen; display-capture; autoplay"
                            />
                        )}
                    </Box>
                </Box>
            </Dialog>
        </MainLayout>
    );
};

export default SchedulePage;
