import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Avatar, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel, Badge } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FlagIcon from '@mui/icons-material/Flag';
import ShieldIcon from '@mui/icons-material/Shield';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import AssessmentIcon from '@mui/icons-material/Assessment';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);

    // Data lists
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [chats, setChats] = useState([]);
    const [activeCalls, setActiveCalls] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [systemConfig, setSystemConfig] = useState({
        rateLimit: 100,
        fileUploadLimit: 20,
        enableCalling: true,
        enableRegistration: true,
        enableFileUpload: true
    });

    // Filtering/Searching
    const [userSearch, setUserSearch] = useState('');
    const [teamSearch, setTeamSearch] = useState('');

    // Activity Modal
    const [activityUser, setActivityUser] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [activityLoading, setActivityLoading] = useState(false);

    // Broadcast state
    const [broadcastContent, setBroadcastContent] = useState('');
    const [broadcasting, setBroadcasting] = useState(false);

    // Manage Team Members state
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembersOpen, setTeamMembersOpen] = useState(false);
    const [allAvailableUsers, setAllAvailableUsers] = useState([]);

    // Check authorization on mount
    useEffect(() => {
        const userObj = JSON.parse(localStorage.getItem("user") || "null");
        if (!userObj) {
            navigate('/auth');
            return;
        }
        if (userObj.role !== 'SUPER_ADMIN') {
            navigate('/chat');
            return;
        }
        setCurrentUser(userObj);
    }, [navigate]);

    // Fetch dashboard data
    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("x-token");
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch Analytics
            const analyticRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/analytics`, { headers });
            if (analyticRes.status === 200) setAnalytics(analyticRes.data.data);

            // Fetch Users
            const userRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users`, { headers });
            if (userRes.status === 200) setUsers(userRes.data.data);

            // Fetch Teams
            const teamRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/teams`, { headers });
            if (teamRes.status === 200) setTeams(teamRes.data.data);

            // Fetch Chats
            const chatRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/chats`, { headers });
            if (chatRes.status === 200) setChats(chatRes.data.data);

            // Fetch Active Calls
            const callRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/calls/active`, { headers });
            if (callRes.status === 200) setActiveCalls(callRes.data.data);

            // Fetch Background Jobs
            const jobRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/jobs`, { headers });
            if (jobRes.status === 200) setJobs(jobRes.data.data);

            // Fetch System Config
            const configRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/config`, { headers });
            if (configRes.status === 200) setSystemConfig(configRes.data.data);

        } catch (error) {
            console.error("Failed to load admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchAdminData();
        }
    }, [currentUser]);

    // Handle user block/unblock
    const handleToggleBlock = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users/${userId}/block`,
                { block: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert(`User successfully ${!currentStatus ? 'blocked' : 'unblocked'}!`);
                setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBlocked: !currentStatus } : u));
            }
        } catch (error) {
            console.error("Failed to toggle block status:", error);
            alert("Could not update block status.");
        }
    };

    // Handle user deletion
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This cannot be undone.")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert("User deleted successfully!");
                setUsers(prev => prev.filter(u => u._id !== userId));
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Could not delete user.");
        }
    };

    // Handle team deletion
    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm("Are you sure you want to delete this group? All messages and history will be permanently wiped.")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/teams/${teamId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert("Group deleted successfully!");
                setTeams(prev => prev.filter(t => t._id !== teamId));
            }
        } catch (error) {
            console.error("Failed to delete group:", error);
            alert("Could not delete group.");
        }
    };

    // View User Activity
    const handleViewActivity = async (user) => {
        setActivityUser(user);
        setActivityLoading(true);
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/users/${user._id}/activity`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                setActivityData(response.data.data);
            }
        } catch (error) {
            console.error("Failed to load user activity:", error);
        } finally {
            setActivityLoading(false);
        }
    };

    // Update system config
    const handleConfigChange = async (key, val) => {
        const updatedConfig = { ...systemConfig, [key]: val };
        setSystemConfig(updatedConfig);
        try {
            const token = localStorage.getItem("x-token");
            await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/config`,
                updatedConfig,
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error("Failed to update system config:", error);
        }
    };

    // Run custom job
    const handleRunJob = async (jobId) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/jobs/${jobId}/run`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert("Job run initiated!");
                setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: 'RUNNING' } : j));
                setTimeout(fetchAdminData, 2000); // refresh after simulation
            }
        } catch (error) {
            console.error("Failed to run job:", error);
        }
    };

    // Broadcast notification
    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!broadcastContent.trim()) return;

        setBroadcasting(true);
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/broadcast`,
                { content: broadcastContent.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert("Broadcast notification successfully sent to all users!");
                setBroadcastContent('');
            }
        } catch (error) {
            console.error("Failed to broadcast message:", error);
            alert("Broadcast failed.");
        } finally {
            setBroadcasting(false);
        }
    };

    // Terminate Active Call
    const handleEndCall = async (roomId) => {
        if (!window.confirm("Are you sure you want to terminate this ongoing call?")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/calls/${roomId}/end`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert("Call terminated successfully.");
                setActiveCalls(prev => prev.filter(c => c.roomId !== roomId));
            }
        } catch (error) {
            console.error("Failed to terminate call:", error);
            alert("Failed to terminate call.");
        }
    };

    // Open Team Members Modal
    const handleManageMembers = (team) => {
        setSelectedTeam(team);
        // Find all users not currently in the team
        const memberIds = new Set(team.members.map(m => m._id.toString()));
        const available = users.filter(u => !memberIds.has(u._id.toString()));
        setAllAvailableUsers(available);
        setTeamMembersOpen(true);
    };

    // Remove user from team
    const handleRemoveTeamMember = async (userId) => {
        if (!selectedTeam) return;
        try {
            const token = localStorage.getItem("x-token");
            const updatedMembers = selectedTeam.members.filter(m => m._id !== userId).map(m => m._id);
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/teams/${selectedTeam._id}/members`,
                { members: updatedMembers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                const updatedRoom = response.data.data;
                setTeams(prev => prev.map(t => t._id === selectedTeam._id ? updatedRoom : t));
                setSelectedTeam(updatedRoom);
                // recalculate available users
                const memberIds = new Set(updatedRoom.members.map(m => m._id.toString()));
                setAllAvailableUsers(users.filter(u => !memberIds.has(u._id.toString())));
            }
        } catch (error) {
            console.error("Failed to remove team member:", error);
        }
    };

    // Add user to team
    const handleAddTeamMember = async (userId) => {
        if (!selectedTeam) return;
        try {
            const token = localStorage.getItem("x-token");
            const updatedMembers = [...selectedTeam.members.map(m => m._id), userId];
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/teams/${selectedTeam._id}/members`,
                { members: updatedMembers },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                const updatedRoom = response.data.data;
                setTeams(prev => prev.map(t => t._id === selectedTeam._id ? updatedRoom : t));
                setSelectedTeam(updatedRoom);
                // recalculate available users
                const memberIds = new Set(updatedRoom.members.map(m => m._id.toString()));
                setAllAvailableUsers(users.filter(u => !memberIds.has(u._id.toString())));
            }
        } catch (error) {
            console.error("Failed to add team member:", error);
        }
    };

    // Moderation Flag toggle
    const handleToggleFlag = async (messageId, currentFlagged) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/messages/${messageId}/flag`,
                { flag: !currentFlagged, reason: !currentFlagged ? "Inappropriate Content flag" : "" },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert(`Message ${!currentFlagged ? 'flagged' : 'unflagged'} successfully!`);
                fetchAdminData(); // reload stats and chats
            }
        } catch (error) {
            console.error("Failed to flag message:", error);
        }
    };

    // Delete inappropriate message
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to moderate and delete this message?")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/admin/messages/${messageId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                alert("Message deleted successfully!");
                fetchAdminData(); // reload
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
        }
    };

    // Filter lists
    const filteredUsers = users.filter(u => {
        const name = `${u.firstName} ${u.lastName}`.toLowerCase();
        return name.includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    });

    const filteredTeams = teams.filter(t => {
        return t.roomName.toLowerCase().includes(teamSearch.toLowerCase());
    });

    return (
        <MainLayout>
            <Box sx={{ width: '100%', height: 'calc(100vh - 67px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', p: 3, bgcolor: '#111', color: '#fff', overflowY: 'auto' }}>
                
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ShieldIcon sx={{ color: '#a3f96d', fontSize: '2.2rem' }} />
                        Super Admin Panel
                    </Typography>
                    <Button 
                        variant="outlined" 
                        onClick={fetchAdminData}
                        sx={{ 
                            textTransform: 'none', 
                            borderColor: '#a3f96d', 
                            color: '#a3f96d', 
                            fontWeight: 'bold',
                            '&:hover': { borderColor: '#8ee05c', bgcolor: 'rgba(163, 249, 109, 0.05)' }
                        }}
                    >
                        Refresh Data
                    </Button>
                </Box>

                {/* Tabs selection */}
                <Tabs 
                    value={currentTab} 
                    onChange={(e, val) => setCurrentTab(val)}
                    sx={{
                        mb: 3,
                        borderBottom: '1px solid #333',
                        '& .MuiTab-root': { color: '#aaa', fontWeight: 'bold', textTransform: 'none', fontSize: '1rem' },
                        '& .Mui-selected': { color: '#a3f96d !important' },
                        '& .MuiTabs-indicator': { bgcolor: '#a3f96d' }
                    }}
                >
                    <Tab label="Analytics & Overview" icon={<AssessmentIcon />} iconPosition="start" />
                    <Tab label="User Management" icon={<PeopleIcon />} iconPosition="start" />
                    <Tab label="Team Management" icon={<PeopleIcon />} iconPosition="start" />
                    <Tab label="System Control" icon={<SettingsIcon />} iconPosition="start" />
                    <Tab label="Moderation & Jobs" icon={<FlagIcon />} iconPosition="start" />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <CircularProgress sx={{ color: '#a3f96d' }} />
                    </Box>
                ) : (
                    <Box sx={{ flexGrow: 1 }}>
                        
                        {/* TAB 0: ANALYTICS & OVERVIEW */}
                        {currentTab === 0 && analytics && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
                                    <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 'bold' }}>TOTAL USERS</Typography>
                                            <Typography variant="h3" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 1 }}>{analytics.stats.totalUsers}</Typography>
                                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mt: 1 }}>{analytics.stats.activeUsers} currently active (online)</Typography>
                                        </CardContent>
                                    </Card>
                                    <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 'bold' }}>ACTIVE TEAMS/GROUPS</Typography>
                                            <Typography variant="h3" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 1 }}>{analytics.stats.totalTeams}</Typography>
                                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mt: 1 }}>Across {analytics.stats.totalChats} total conversations</Typography>
                                        </CardContent>
                                    </Card>
                                    <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 'bold' }}>TOTAL MESSAGES</Typography>
                                            <Typography variant="h3" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 1 }}>{analytics.stats.totalMessages}</Typography>
                                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mt: 1 }}>Exchanged by platform members</Typography>
                                        </CardContent>
                                    </Card>
                                    <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                        <CardContent>
                                            <Typography sx={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 'bold' }}>ACTIVE VIDEO CALLS</Typography>
                                            <Typography variant="h3" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 1 }}>{analytics.stats.activeCallsCount}</Typography>
                                            <Typography sx={{ color: '#888', fontSize: '0.75rem', mt: 1 }}>Currently ongoing Jitsi rooms</Typography>
                                        </CardContent>
                                    </Card>
                                </Box>

                                {/* Message Stats chart using standard premium SVG */}
                                <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px', p: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>Message Traffic (Last 7 Days)</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', px: 2, pt: 2, borderBottom: '1px solid #444' }}>
                                            {analytics.messageStats.map((item, idx) => {
                                                const maxVal = Math.max(...analytics.messageStats.map(s => s.count), 1);
                                                const heightPct = (item.count / maxVal) * 100;
                                                return (
                                                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
                                                        <Tooltip title={`${item.count} messages`} arrow>
                                                            <Box sx={{ width: '30px', height: `${heightPct * 1.5}px`, minHeight: '5px', bgcolor: '#a3f96d', borderRadius: '4px 4px 0 0', '&:hover': { bgcolor: '#8ee05c' }, transition: 'all 0.2s' }} />
                                                        </Tooltip>
                                                        <Typography sx={{ color: '#aaa', fontSize: '0.75rem', mt: 1 }}>{item._id.substring(5)}</Typography>
                                                    </Box>
                                                );
                                            })}
                                            {analytics.messageStats.length === 0 && (
                                                <Typography sx={{ color: '#888', fontStyle: 'italic', display: 'block', mx: 'auto', mb: 5 }}>No message traffic recorded in the last 7 days.</Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>

                                {/* Active Call Terminate interface */}
                                <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <VideocamIcon sx={{ color: '#ff4444' }} /> Ongoing Video Calls Monitor
                                        </Typography>
                                        {activeCalls.length === 0 ? (
                                            <Typography sx={{ color: '#888', fontStyle: 'italic', mt: 1 }}>No active calls are currently running on the server.</Typography>
                                        ) : (
                                            <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                                                <Table sx={{ minWidth: 650 }}>
                                                    <TableHead sx={{ '& th': { color: '#aaa', borderColor: '#333', fontWeight: 'bold' } }}>
                                                        <TableRow>
                                                            <TableCell>Room Name</TableCell>
                                                            <TableCell>Host / Initiator</TableCell>
                                                            <TableCell>Room Type</TableCell>
                                                            <TableCell align="right">Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody sx={{ '& td': { color: '#fff', borderColor: '#222' } }}>
                                                        {activeCalls.map((call) => (
                                                            <TableRow key={call.roomId}>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>{call.roomName}</TableCell>
                                                                <TableCell>{call.hostName}</TableCell>
                                                                <TableCell sx={{ textTransform: 'capitalize' }}>{call.roomType}</TableCell>
                                                                <TableCell align="right">
                                                                    <Button 
                                                                        variant="contained" 
                                                                        color="error" 
                                                                        size="small"
                                                                        onClick={() => handleEndCall(call.roomId)}
                                                                        sx={{ textTransform: 'none', fontWeight: 'bold' }}
                                                                    >
                                                                        Terminate Call
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </Box>
                        )}

                        {/* TAB 1: USER MANAGEMENT */}
                        {currentTab === 1 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Search users by name or email..."
                                    variant="outlined"
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& input': { color: '#f0f0f0' },
                                            '& fieldset': { borderColor: '#333' },
                                            '&:hover fieldset': { borderColor: '#555' },
                                            '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                        },
                                        '& .MuiInputBase-input::placeholder': { color: '#888', opacity: 1 }
                                    }}
                                />
                                <TableContainer component={Paper} sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', borderRadius: '12px' }}>
                                    <Table sx={{ minWidth: 650 }}>
                                        <TableHead sx={{ '& th': { color: '#aaa', borderColor: '#333', fontWeight: 'bold', bgcolor: '#151515' } }}>
                                            <TableRow>
                                                <TableCell>User</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Phone No</TableCell>
                                                <TableCell>Role</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody sx={{ '& td': { color: '#fff', borderColor: '#222' } }}>
                                            {filteredUsers.map((user) => (
                                                <TableRow key={user._id} sx={{ '&:hover': { bgcolor: '#242424' } }}>
                                                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar src={user.profilePicture}>{user.firstName[0]}</Avatar>
                                                        <Typography sx={{ fontWeight: 'bold' }}>{user.firstName} {user.lastName}</Typography>
                                                    </TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.phoneNo || 'N/A'}</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold', color: user.role === 'SUPER_ADMIN' ? '#a3f96d' : '#fff' }}>{user.role}</TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ width: '8px', height: '8px', borderRadius: '50%', bgcolor: user.isBlocked ? '#ff4444' : (user.isOnline ? '#0f0' : '#888') }} />
                                                            <Typography sx={{ fontSize: '0.85rem' }}>{user.isBlocked ? 'Blocked' : (user.isOnline ? 'Online' : 'Offline')}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                            <IconButton onClick={() => handleViewActivity(user)} sx={{ color: '#a3f96d' }} title="View User Activity">
                                                                <InfoIcon />
                                                            </IconButton>
                                                            {user.role !== 'SUPER_ADMIN' && (
                                                                <>
                                                                    <IconButton 
                                                                        onClick={() => handleToggleBlock(user._id, user.isBlocked)} 
                                                                        sx={{ color: user.isBlocked ? '#0f0' : '#ffc107' }} 
                                                                        title={user.isBlocked ? "Unblock User" : "Block User"}
                                                                    >
                                                                        {user.isBlocked ? <CheckCircleIcon /> : <BlockIcon />}
                                                                    </IconButton>
                                                                    <IconButton onClick={() => handleDeleteUser(user._id)} sx={{ color: '#ff4444' }} title="Delete User">
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ color: '#888', fontStyle: 'italic', py: 4 }}>No users found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* TAB 2: TEAM MANAGEMENT */}
                        {currentTab === 2 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Search teams by room name..."
                                    variant="outlined"
                                    value={teamSearch}
                                    onChange={(e) => setTeamSearch(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& input': { color: '#f0f0f0' },
                                            '& fieldset': { borderColor: '#333' },
                                            '&:hover fieldset': { borderColor: '#555' },
                                            '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                        },
                                        '& .MuiInputBase-input::placeholder': { color: '#888', opacity: 1 }
                                    }}
                                />
                                <TableContainer component={Paper} sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', borderRadius: '12px' }}>
                                    <Table sx={{ minWidth: 650 }}>
                                        <TableHead sx={{ '& th': { color: '#aaa', borderColor: '#333', fontWeight: 'bold', bgcolor: '#151515' } }}>
                                            <TableRow>
                                                <TableCell>Team Name</TableCell>
                                                <TableCell>Members Count</TableCell>
                                                <TableCell>Created Date</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody sx={{ '& td': { color: '#fff', borderColor: '#222' } }}>
                                            {filteredTeams.map((team) => (
                                                <TableRow key={team._id} sx={{ '&:hover': { bgcolor: '#242424' } }}>
                                                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar src={team.roomProfile}>{team.roomName[0]}</Avatar>
                                                        <Typography sx={{ fontWeight: 'bold' }}>{team.roomName}</Typography>
                                                    </TableCell>
                                                    <TableCell>{team.members?.length || 0} members</TableCell>
                                                    <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                            <Button 
                                                                variant="outlined" 
                                                                size="small" 
                                                                onClick={() => handleManageMembers(team)}
                                                                sx={{ textTransform: 'none', color: '#a3f96d', borderColor: '#a3f96d', fontWeight: 'bold', '&:hover': { borderColor: '#8ee05c' } }}
                                                            >
                                                                Manage Members
                                                            </Button>
                                                            <IconButton onClick={() => handleDeleteTeam(team._id)} sx={{ color: '#ff4444' }} title="Delete Team">
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredTeams.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ color: '#888', fontStyle: 'italic', py: 4 }}>No teams found.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* TAB 3: SYSTEM CONTROL */}
                        {currentTab === 3 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                                    <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', borderBottom: '1px solid #333', pb: 1 }}>System Limits</Typography>
                                            
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="API Rate Limit (reqs / min)"
                                                value={systemConfig.rateLimit}
                                                onChange={(e) => handleConfigChange('rateLimit', parseInt(e.target.value) || 0)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& input': { color: '#f0f0f0' },
                                                        '& fieldset': { borderColor: '#444' },
                                                        '&:hover fieldset': { borderColor: '#666' },
                                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                                    },
                                                    '& .MuiInputLabel-root': { color: '#aaa' }
                                                }}
                                            />

                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="File Upload Limit (MB)"
                                                value={systemConfig.fileUploadLimit}
                                                onChange={(e) => handleConfigChange('fileUploadLimit', parseInt(e.target.value) || 0)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& input': { color: '#f0f0f0' },
                                                        '& fieldset': { borderColor: '#444' },
                                                        '&:hover fieldset': { borderColor: '#666' },
                                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                                    },
                                                    '& .MuiInputLabel-root': { color: '#aaa' }
                                                }}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', borderBottom: '1px solid #333', pb: 1 }}>Feature Flags</Typography>
                                            
                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={systemConfig.enableCalling} 
                                                        onChange={(e) => handleConfigChange('enableCalling', e.target.checked)} 
                                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a3f96d' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#a3f96d' } }}
                                                    />
                                                }
                                                label="Enable Video & Voice Calling (Jitsi Overlay)"
                                                sx={{ py: 1 }}
                                            />

                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={systemConfig.enableRegistration} 
                                                        onChange={(e) => handleConfigChange('enableRegistration', e.target.checked)} 
                                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a3f96d' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#a3f96d' } }}
                                                    />
                                                }
                                                label="Enable Public Account Registration"
                                                sx={{ py: 1 }}
                                            />

                                            <FormControlLabel
                                                control={
                                                    <Switch 
                                                        checked={systemConfig.enableFileUpload} 
                                                        onChange={(e) => handleConfigChange('enableFileUpload', e.target.checked)} 
                                                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#a3f96d' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#a3f96d' } }}
                                                    />
                                                }
                                                label="Enable File Attachment Uploads"
                                                sx={{ py: 1 }}
                                            />
                                        </CardContent>
                                    </Card>
                                </Box>

                                {/* System Logs panel simulation */}
                                <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Real-time System Logs</Typography>
                                        <Box sx={{ bgcolor: '#000', p: 2, borderRadius: '8px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '0.85rem', color: '#0f0', maxHeight: '200px', overflowY: 'auto' }}>
                                            <div>[INFO] {new Date().toISOString()} - Mongoose connection verified.</div>
                                            <div>[INFO] {new Date().toISOString()} - Redis pub/sub adapter online.</div>
                                            <div>[INFO] {new Date().toISOString()} - Loaded rate limit controls: {systemConfig.rateLimit} reqs/min.</div>
                                            <div>[INFO] {new Date().toISOString()} - File limits set: {systemConfig.fileUploadLimit}MB max size.</div>
                                            <div>[INFO] {new Date().toISOString()} - Jitsi iframe bridge configured securely.</div>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        )}

                        {/* TAB 4: MODERATION & JOBS */}
                        {currentTab === 4 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                
                                {/* Broadcast form */}
                                <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SendIcon sx={{ color: '#a3f96d' }} /> Send Broadcast Notification
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                                            This message will be instantly sent as an unread offline notification badge to every single user on the platform.
                                        </Typography>
                                        <form onSubmit={handleBroadcast} style={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                fullWidth
                                                required
                                                placeholder="Type system alert, announcement, or maintenance notice..."
                                                value={broadcastContent}
                                                onChange={(e) => setBroadcastContent(e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& input': { color: '#f0f0f0' },
                                                        '& fieldset': { borderColor: '#444' },
                                                        '&:hover fieldset': { borderColor: '#666' },
                                                        '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                                    }
                                                }}
                                            />
                                            <Button 
                                                type="submit" 
                                                variant="contained" 
                                                disabled={broadcasting}
                                                sx={{ bgcolor: '#a3f96d', color: '#000', fontWeight: 'bold', '&:hover': { bgcolor: '#8ee05c' }, px: 3 }}
                                            >
                                                {broadcasting ? <CircularProgress size={24} /> : 'Broadcast'}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Background jobs table */}
                                <Card sx={{ bgcolor: '#1E1E1E', border: '1px solid #333', color: '#fff', borderRadius: '15px' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>System Background Jobs</Typography>
                                        <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                                            <Table sx={{ minWidth: 650 }}>
                                                <TableHead sx={{ '& th': { color: '#aaa', borderColor: '#333', fontWeight: 'bold' } }}>
                                                    <TableRow>
                                                        <TableCell>Job Name</TableCell>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Last Run</TableCell>
                                                        <TableCell>Runs Count</TableCell>
                                                        <TableCell align="right">Actions</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody sx={{ '& td': { color: '#fff', borderColor: '#222' } }}>
                                                    {jobs.map((job) => (
                                                        <TableRow key={job._id}>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>
                                                                {job.name}
                                                                {job.failureReason && (
                                                                    <Typography variant="caption" sx={{ display: 'block', color: '#ff4444' }}>{job.failureReason}</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography sx={{ 
                                                                    fontWeight: 'bold', 
                                                                    fontSize: '0.85rem',
                                                                    color: job.status === 'COMPLETED' ? '#0f0' : (job.status === 'RUNNING' ? '#0af' : (job.status === 'FAILED' ? '#f44' : '#ffc107'))
                                                                }}>
                                                                    {job.status}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>{job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}</TableCell>
                                                            <TableCell>{job.runCount}</TableCell>
                                                            <TableCell align="right">
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<PlayArrowIcon />}
                                                                    disabled={job.status === 'RUNNING'}
                                                                    onClick={() => handleRunJob(job._id)}
                                                                    sx={{ color: '#a3f96d', borderColor: '#a3f96d', textTransform: 'none', fontWeight: 'bold', '&:hover': { borderColor: '#8ee05c' } }}
                                                                >
                                                                    Trigger Run
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {jobs.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={5} align="center" sx={{ color: '#888', fontStyle: 'italic', py: 4 }}>
                                                                No background jobs are active.
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </CardContent>
                                </Card>
                            </Box>
                        )}
                        
                    </Box>
                )}

                {/* USER ACTIVITY MODAL */}
                <Dialog
                    open={activityUser !== null}
                    onClose={() => { setActivityUser(null); setActivityData(null); }}
                    fullWidth
                    maxWidth="sm"
                    slotProps={{
                        paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } }
                    }}
                >
                    <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>User Activity Profile</Typography>
                        <IconButton size="small" onClick={() => { setActivityUser(null); setActivityData(null); }} sx={{ color: '#fff' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        {activityLoading || !activityData ? (
                            <CircularProgress sx={{ display: 'block', mx: 'auto', color: '#a3f96d' }} />
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={activityData.user.profilePicture} sx={{ width: 64, height: 64 }} />
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{activityData.user.firstName} {activityData.user.lastName}</Typography>
                                        <Typography sx={{ color: '#aaa', fontSize: '0.9rem' }}>{activityData.user.email}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, bgcolor: '#222', p: 2, borderRadius: '8px' }}>
                                    <Box align="center">
                                        <Typography sx={{ color: '#aaa', fontSize: '0.75rem' }}>TOTAL MESSAGES</Typography>
                                        <Typography variant="h5" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 0.5 }}>{activityData.stats.messageCount}</Typography>
                                    </Box>
                                    <Box align="center">
                                        <Typography sx={{ color: '#aaa', fontSize: '0.75rem' }}>GROUPS JOINED</Typography>
                                        <Typography variant="h5" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 0.5 }}>{activityData.stats.groupsJoined}</Typography>
                                    </Box>
                                    <Box align="center">
                                        <Typography sx={{ color: '#aaa', fontSize: '0.75rem' }}>DIRECT CHATS</Typography>
                                        <Typography variant="h5" sx={{ color: '#a3f96d', fontWeight: 'bold', mt: 0.5 }}>{activityData.stats.directChats}</Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>Recent Messages</Typography>
                                    {activityData.recentMessages.length === 0 ? (
                                        <Typography sx={{ color: '#888', fontStyle: 'italic' }}>No messages sent yet.</Typography>
                                    ) : (
                                        <List sx={{ bgcolor: '#151515', borderRadius: '8px', p: 0 }}>
                                            {activityData.recentMessages.map((msg, idx) => (
                                                <ListItem key={msg._id} divider={idx < activityData.recentMessages.length - 1} sx={{ borderColor: '#333', py: 1.5 }}>
                                                    <ListItemText
                                                        primary={msg.content || '[Media Attachment]'}
                                                        secondary={`Room: ${msg.roomId?.roomName || 'Private chat'} | Sent: ${new Date(msg.createdAt).toLocaleString()}`}
                                                        slotProps={{ primary: { sx: { color: '#fff', fontSize: '0.9rem' } }, secondary: { sx: { color: '#aaa', fontSize: '0.75rem' } } }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>

                {/* MANAGE TEAM MEMBERS MODAL */}
                <Dialog
                    open={teamMembersOpen}
                    onClose={() => { setTeamMembersOpen(false); setSelectedTeam(null); }}
                    fullWidth
                    maxWidth="sm"
                    slotProps={{
                        paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } }
                    }}
                >
                    <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Manage Team Members</Typography>
                        <IconButton size="small" onClick={() => { setTeamMembersOpen(false); setSelectedTeam(null); }} sx={{ color: '#fff' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, mt: 1, maxHeight: '450px', overflowY: 'auto' }}>
                        {selectedTeam && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: '#a3f96d', fontWeight: 'bold', mb: 1 }}>Current Members</Typography>
                                    <List sx={{ bgcolor: '#151515', borderRadius: '8px', p: 0 }}>
                                        {selectedTeam.members.map((member) => (
                                            <ListItem 
                                                key={member._id} 
                                                secondaryAction={
                                                    <Button size="small" color="error" onClick={() => handleRemoveTeamMember(member._id)}>
                                                        Remove
                                                    </Button>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar src={member.profilePicture}>{member.firstName[0]}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={`${member.firstName} ${member.lastName}`}
                                                    secondary={member.email}
                                                    slotProps={{ primary: { sx: { color: '#fff', fontWeight: 'bold' } }, secondary: { sx: { color: '#aaa' } } }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: '#a3f96d', fontWeight: 'bold', mb: 1 }}>Add Other Users</Typography>
                                    {allAvailableUsers.length === 0 ? (
                                        <Typography sx={{ color: '#888', fontStyle: 'italic' }}>All system users are already members of this team.</Typography>
                                    ) : (
                                        <List sx={{ bgcolor: '#151515', borderRadius: '8px', p: 0, maxHeight: '200px', overflowY: 'auto' }}>
                                            {allAvailableUsers.map((user) => (
                                                <ListItem 
                                                    key={user._id} 
                                                    secondaryAction={
                                                        <Button size="small" sx={{ color: '#a3f96d' }} onClick={() => handleAddTeamMember(user._id)}>
                                                            Add
                                                        </Button>
                                                    }
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar src={user.profilePicture}>{user.firstName[0]}</Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText 
                                                        primary={`${user.firstName} ${user.lastName}`}
                                                        secondary={user.email}
                                                        slotProps={{ primary: { sx: { color: '#fff', fontWeight: 'bold' } }, secondary: { sx: { color: '#aaa' } } }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>

            </Box>
        </MainLayout>
    );
};

export default AdminDashboard;
