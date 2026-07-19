import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, LinearProgress, CircularProgress, Dialog, DialogTitle, DialogContent, TextField, List, ListItem, ListItemAvatar, ListItemText, Avatar, Button } from '@mui/material';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import ConversationItem from './ConversationItem';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import socket from './Socket';

const ChatWindow = ({ room, currentUserId, setRoom }) => {
    const [messages, setMessages] = useState([]);
    const [replyTo, setReplyTo] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Typing states
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const lastMessageIdRef = useRef('');

    // Add Member Dialog states
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [viewMembersOpen, setViewMembersOpen] = useState(false);
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [uploadingGroupIcon, setUploadingGroupIcon] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');
    const [updatingGroupName, setUpdatingGroupName] = useState(false);

    // Search users to add to group
    useEffect(() => {
        if (!memberSearchQuery.trim()) {
            setFoundUsers([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setSearchingUsers(true);
            try {
                const token = localStorage.getItem("x-token");
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/search?q=${memberSearchQuery}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    // Filter out users who are already members of this room
                    const existingMemberIds = new Set(room?.members?.map(m => (m._id || m).toString()) || []);
                    const filtered = response.data.data.filter(u => !existingMemberIds.has(u._id.toString()));
                    setFoundUsers(filtered);
                }
            } catch (error) {
                console.error("Failed to search users:", error);
            } finally {
                setSearchingUsers(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [memberSearchQuery, room]);

    const handleAddMember = async (userId) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/add-members/${room._id}`, {
                members: [userId]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                alert("Member added successfully!");
                setAddMemberOpen(false);
                setMemberSearchQuery('');
                
                // Optimistically update parent room state to reflect the new member list
                if (setRoom) {
                    setRoom(prev => {
                        const updatedMembers = [...(prev.members || [])];
                        const newMemberObj = foundUsers.find(u => u._id === userId);
                        if (newMemberObj && !updatedMembers.some(m => (m._id || m).toString() === userId)) {
                            updatedMembers.push(newMemberObj);
                        }
                        return { ...prev, members: updatedMembers };
                    });
                }
            }
        } catch (error) {
            console.error("Failed to add member:", error);
            alert("Could not add member. Please try again.");
        }
    };

    const handleDeleteMember = async (userId) => {
        if (!confirm("Are you sure you want to remove this member from the group?")) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/delete-members/${room._id}`, {
                members: [userId]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                alert("Member removed successfully!");
                
                // Optimistically update parent room state to reflect the removed member
                if (setRoom) {
                    setRoom(prev => {
                        const updatedMembers = prev.members?.filter(m => (m._id || m).toString() !== userId.toString()) || [];
                        return { ...prev, members: updatedMembers };
                    });
                }
            }
        } catch (error) {
            console.error("Failed to delete member:", error);
            alert("Could not remove member. Please try again.");
        }
    };

    const handleGroupIconChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingGroupIcon(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/update-room-profile/${room._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            if (response.status === 200 && response.data?.data) {
                const updatedRoom = response.data.data;
                if (setRoom) {
                    setRoom(prev => ({
                        ...prev,
                        roomProfile: updatedRoom.roomProfile,
                        profilePic: updatedRoom.roomProfile
                    }));
                }
                alert("Group profile picture updated successfully!");
            }
        } catch (error) {
            console.error("Failed to update group profile picture:", error);
            alert("Could not update group profile picture. Please try again.");
        } finally {
            setUploadingGroupIcon(false);
        }
    };

    const handleUpdateGroupName = async () => {
        if (!editNameValue.trim()) {
            alert("Group name cannot be empty");
            return;
        }
        setUpdatingGroupName(true);
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/update-room-name/${room._id}`,
                { roomName: editNameValue.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200 && response.data?.data) {
                const updatedRoom = response.data.data;
                if (setRoom) {
                    setRoom(prev => ({
                        ...prev,
                        roomName: updatedRoom.roomName,
                        name: updatedRoom.roomName
                    }));
                }
                setIsEditingName(false);
                alert("Group name updated successfully!");
            }
        } catch (error) {
            console.error("Failed to update group name:", error);
            alert("Could not update group name. Please try again.");
        } finally {
            setUpdatingGroupName(false);
        }
    };

    const handleCopyInviteLink = async () => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rooms/invite-code/${room._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const inviteCode = response.data.data.inviteCode;
                const inviteLink = `${window.location.origin}/join/${inviteCode}`;
                await navigator.clipboard.writeText(inviteLink);
                alert("Invite link copied to clipboard!");
            }
        } catch (error) {
            console.error("Failed to get invite link:", error);
            alert("Could not generate invite link.");
        }
    };

    // Load current user from localStorage on mount
    useEffect(() => {
        const userObj = JSON.parse(localStorage.getItem("user") || "null");
        setCurrentUser(userObj);
    }, []);

    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    };

    const fetchInitialMessages = async () => {
        if (!room?._id) return;
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/get-messages/${room._id}`, {
                page: 1,
                limit: 30
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const { result, count } = response.data.data;
                const reversed = [...result].reverse();
                setMessages(reversed);
                setHasMore(reversed.length < count);

                // Scroll to bottom after loading initial messages
                setTimeout(() => {
                    scrollToBottom('auto');
                }, 100);
            }
        } catch (error) {
            console.error("Failed to fetch initial messages:", error);
        }
    };

    // Reset and fetch initial page when room changes
    useEffect(() => {
        if (room?._id) {
            setPage(1);
            setHasMore(true);
            setMessages([]);
            lastMessageIdRef.current = '';

            // Join socket room
            socket.emit("joinRoom", room._id);

            fetchInitialMessages();
        } else {
            setMessages([]);
        }
    }, [room]);

    // Reset typing status on room switch
    useEffect(() => {
        if (isTypingRef.current && room?._id) {
            socket.emit("stopTyping", { roomId: room._id, userId: currentUser?._id || currentUserId });
        }
        isTypingRef.current = false;
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setTypingUsers([]);
    }, [room]);

    const loadMoreMessages = async () => {
        if (loadingMore || !hasMore || !room?._id) return;
        setLoadingMore(true);

        const container = messagesContainerRef.current;
        const previousScrollHeight = container ? container.scrollHeight : 0;

        try {
            const token = localStorage.getItem("x-token");
            const nextPage = page + 1;
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/get-messages/${room._id}`, {
                page: nextPage,
                limit: 30
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                const { result, count } = response.data.data;
                const reversed = [...result].reverse();

                setMessages((prev) => {
                    const prevIds = new Set(prev.map(m => m._id));
                    const filteredNew = reversed.filter(m => !prevIds.has(m._id));
                    return [...filteredNew, ...prev];
                });

                setPage(nextPage);
                setHasMore((messages.length + reversed.length) < count);

                // Maintain scroll position
                setTimeout(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight - previousScrollHeight;
                    }
                }, 0);
            }
        } catch (error) {
            console.error("Failed to load more messages:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleScroll = (e) => {
        const container = e.currentTarget;
        if (container.scrollTop <= 5 && hasMore && !loadingMore) {
            loadMoreMessages();
        }
    };

    // Handle real-time incoming messages via socket
    useEffect(() => {
        const handleReceiveMessage = (newMessage) => {
            const newRoomId = newMessage.roomId?.toString() || newMessage.roomId;
            const currentRoomId = room?._id?.toString() || room?._id;
            if (newRoomId === currentRoomId) {
                setMessages((prev) => {
                    // Check if we already have this message by ID
                    if (prev.some(m => m._id === newMessage._id)) return prev;

                    // Remove temporary optimistic message with same content
                    const filtered = prev.filter(m => !(m.isTemp && m.content === newMessage.content));
                    return [...filtered, newMessage];
                });

                // Update parent room's lastMessage so the header ConversationItem updates in real-time
                if (setRoom) {
                    const hasMedia = newMessage.mediaUrl && newMessage.mediaUrl.length > 0;
                    setRoom(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            lastMessage: newMessage.content || (hasMedia ? 'Attachment' : 'Message')
                        };
                    });
                }
            }
        };

        const handleMessageEdited = (editedMessage) => {
            const currentRoomId = room?._id?.toString() || room?._id;
            if (editedMessage.roomId?.toString() === currentRoomId) {
                setMessages((prev) =>
                    prev.map((m) => (m._id === editedMessage._id ? editedMessage : m))
                );
            }
        };

        const handleMessageDeleted = (data) => {
            const currentRoomId = room?._id?.toString() || room?._id;
            if (data.roomId?.toString() === currentRoomId) {
                setMessages((prev) =>
                    prev.map((m) => (m._id === data.messageId ? { ...m, deleted: true, content: "", mediaUrl: [] } : m))
                );
            }
        };

        const handleUserTyping = (data) => {
            if (data.roomId === room?._id) {
                setTypingUsers((prev) => {
                    if (prev.some(u => u.userId === data.userId)) return prev;
                    return [...prev, { userId: data.userId, username: data.username }];
                });
            }
        };

        const handleUserStopTyping = (data) => {
            if (data.roomId === room?._id) {
                setTypingUsers((prev) => prev.filter(u => u.userId !== data.userId));
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("messageEdited", handleMessageEdited);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("userTyping", handleUserTyping);
        socket.on("userStopTyping", handleUserStopTyping);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("messageEdited", handleMessageEdited);
            socket.off("messageDeleted", handleMessageDeleted);
            socket.off("userTyping", handleUserTyping);
            socket.off("userStopTyping", handleUserStopTyping);
        };
    }, [room, setRoom]);

    // Handle real-time incoming message reactions via socket
    useEffect(() => {
        const handleMessageReaction = (data) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if (m._id === data.messageId) {
                        return { ...m, reactions: data.reactions };
                    }
                    return m;
                })
            );
        };

        socket.on("messageReaction", handleMessageReaction);
        return () => {
            socket.off("messageReaction", handleMessageReaction);
        };
    }, []);

    // Handle real-time incoming read receipts via socket
    useEffect(() => {
        const handleMessageRead = (data) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if (m._id === data.messageId) {
                        const existing = m.readReceipts || [];
                        const exists = existing.some(
                            (r) => (r.userId?._id || r.userId)?.toString() === data.userId?.toString()
                        );
                        if (!exists) {
                            return {
                                ...m,
                                readReceipts: [
                                    ...existing,
                                    { userId: data.userId, isRead: true, readAt: new Date() }
                                ]
                            };
                        }
                    }
                    return m;
                })
            );
        };

        socket.on("messageRead", handleMessageRead);
        return () => {
            socket.off("messageRead", handleMessageRead);
        };
    }, []);

    // Automatically mark received messages as read when they are loaded/rendered
    useEffect(() => {
        if (!room?._id || !currentUserId || messages.length === 0) return;

        messages.forEach((msg) => {
            const senderId = (msg.sender?._id || msg.sender)?.toString();
            if (senderId === currentUserId) return; // Only read messages from others

            const myReceiptExists = msg.readReceipts?.some(
                (r) => (r.userId?._id || r.userId)?.toString() === currentUserId
            );

            if (!myReceiptExists) {
                // Emit socket event to notify sender and save in DB
                socket.emit("read", {
                    messageId: msg._id,
                    userId: currentUserId,
                    roomId: room._id
                });

                // Update local state to avoid double emitting
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m._id === msg._id) {
                            return {
                                ...m,
                                readReceipts: [
                                    ...(m.readReceipts || []),
                                    { userId: currentUserId, isRead: true, readAt: new Date() }
                                ]
                            };
                        }
                        return m;
                    })
                );
            }
        });
    }, [messages, currentUserId, room]);

    // Autoscroll to bottom when a new message is appended at the end
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            const lastMsgId = lastMsg._id?.toString();
            
            if (lastMsgId && lastMsgId !== lastMessageIdRef.current) {
                lastMessageIdRef.current = lastMsgId;
                const isMyMsg = (lastMsg.sender?._id || lastMsg.sender)?.toString() === currentUserId;
                scrollToBottom(isMyMsg ? 'smooth' : 'auto');
            }
        } else {
            lastMessageIdRef.current = '';
        }
    }, [messages, currentUserId]);


    // Handle sending message (text and/or attachments)
    const handleSend = async (msg) => {
        if (!room || !currentUser) return;
        const token = localStorage.getItem("x-token");

        const tempId = `temp_${Date.now()}`;
        const tempMessage = {
            _id: tempId,
            roomId: room._id,
            sender: currentUser._id || currentUserId,
            content: msg.text || "",
            mediaUrl: attachments.map(att => att.preview),
            parentMessageId: replyTo?._id,
            createdAt: new Date().toISOString(),
            isTemp: true
        };

        // Immediately update sender's UI optimistically
        setMessages(prev => [...prev, tempMessage]);

        // Clear reply bar
        setReplyTo(null);

        if (attachments.length > 0) {
            // Handle sending file attachment via REST API
            const formData = new FormData();
            formData.append("roomId", room._id);
            formData.append("sender", currentUser._id || currentUserId);
            formData.append("content", msg.text || "");
            if (replyTo) {
                formData.append("parentMessageId", replyTo._id);
            }
            attachments.forEach(att => {
                formData.append("files", att.file);
            });

            try {
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/send-message`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                if (response.status === 201 && response.data?.data) {
                    const savedMessage = response.data.data;
                    // Replace temp message with actual saved message
                    setMessages(prev => prev.map(m => m._id === tempId ? savedMessage : m));

                    // Update parent room state so header updates
                    if (setRoom) {
                        const hasMedia = savedMessage.mediaUrl && savedMessage.mediaUrl.length > 0;
                        setRoom(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                lastMessage: savedMessage.content || (hasMedia ? 'Attachment' : 'Message')
                            };
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to send message with attachment:", error);
                // Mark as failed
                setMessages(prev => prev.map(m => m._id === tempId ? { ...m, failed: true } : m));
            }
        } else {
            // Send text message directly over socket
            const messageData = {
                roomId: room._id,
                sender: currentUser._id || currentUserId,
                content: msg.text
            };
            if (replyTo) {
                messageData.parentMessageId = replyTo._id;
            }
            socket.emit("sendMessage", messageData);
        }
    };
    const handleEditMessage = async (messageId, newContent) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/edit-message/${messageId}`,
                { content: newContent },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200 && response.data?.data) {
                const updatedMsg = response.data.data;
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content: updatedMsg.content, edited: true } : m));
            }
        } catch (error) {
            console.error("Failed to edit message:", error);
            alert("Could not edit message. Please try again.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            const token = localStorage.getItem("x-token");
            const response = await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/delete-message/${messageId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.status === 200) {
                setMessages(prev => prev.map(m => m._id === messageId ? { ...m, deleted: true, content: "", mediaUrl: [] } : m));
            }
        } catch (error) {
            console.error("Failed to delete message:", error);
            alert("Could not delete message. Please try again.");
        }
    };

    const handleTyping = (hasText) => {
        if (!room || !currentUser) return;
        const roomId = room._id;
        const userId = currentUser._id || currentUserId;
        const username = currentUser.firstName || currentUser.username || 'Someone';

        if (hasText) {
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                socket.emit("typing", { roomId, userId, username });
            }

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", { roomId, userId });
                isTypingRef.current = false;
            }, 3000);
        } else {
            if (isTypingRef.current) {
                socket.emit("stopTyping", { roomId, userId });
                isTypingRef.current = false;
            }
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const getTypingText = () => {
        if (typingUsers.length === 0) return undefined;
        if (typingUsers.length === 1) {
            return `${typingUsers[0].username} is typing...`;
        }
        if (typingUsers.length === 2) {
            return `${typingUsers[0].username} & ${typingUsers[1].username} are typing...`;
        }
        return "Several people are typing...";
    };
    const handleReact = async (msg, emoji) => {
        if (!room || !currentUser) return;
        const token = localStorage.getItem("x-token");
        const currentId = (currentUser._id || currentUserId)?.toString();

        const existingReactions = msg.reactions || [];
        const myExistingIndex = existingReactions.findIndex((r) => {
            const rUserId = (r.userId?._id || r.userId || r.sender?._id || r.sender)?.toString();
            return rUserId === currentId;
        });

        let newReactions = [...existingReactions];
        if (myExistingIndex > -1) {
            // Toggle reaction: if same emoji, remove it; else update it
            if (newReactions[myExistingIndex].emoji === emoji) {
                newReactions.splice(myExistingIndex, 1);
            } else {
                newReactions[myExistingIndex] = {
                    ...newReactions[myExistingIndex],
                    emoji
                };
            }
        } else {
            newReactions.push({
                userId: currentId,
                sender: currentId,
                emoji
            });
        }

        // Optimistically update reactions locally
        setMessages((prev) =>
            prev.map((m) => {
                if (m._id === msg._id) {
                    return { ...m, reactions: newReactions };
                }
                return m;
            })
        );

        // Optimistically emit the reaction update event over socket for instant real-time syncing
        socket.emit("reaction", {
            roomId: room._id,
            messageId: msg._id,
            reactions: newReactions
        });

        try {
            await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/react-message/${msg._id}`, {
                userId: currentId,
                sender: currentId,
                emoji
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Failed to react to message:", error);
        }
    };

    if (!room?._id) {
        return (
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    width: 'calc(100vw - 100px)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #666',
                    borderRadius: '15px',
                    mr: 8
                }}
            >
                <Typography sx={{ color: '#aaa', fontStyle: 'italic' }}>
                    Select a conversation to start chatting
                </Typography>
            </Box>
        );
    }

    // Group messages by day
    const grouped = [];
    messages.forEach((msg) => {
        if (!msg) return;
        const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
        if (isNaN(msgDate.getTime())) return;

        let dayLabel;
        if (isToday(msgDate)) {
            dayLabel = 'Today';
        } else if (isYesterday(msgDate)) {
            dayLabel = 'Yesterday';
        } else {
            dayLabel = format(msgDate, 'MMMM d, yyyy');
        }

        const lastGroup = grouped[grouped.length - 1];
        if (lastGroup && isSameDay(new Date(lastGroup.date), msgDate)) {
            lastGroup.items.push(msg);
        } else {
            grouped.push({ date: msgDate, label: dayLabel, items: [msg] });
        }
    });

    // Filter messages by search term
    const filteredGroups = grouped.map(group => ({
        ...group,
        items: group.items.filter(msg =>
            (msg.content || "").toLowerCase().includes((searchTerm || "").toLowerCase())
        )
    }));

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate file size (limit: 5MB)
        const oversized = files.find(f => f.size > 5 * 1024 * 1024);
        if (oversized) {
            alert(`File "${oversized.name}" exceeds the 5MB size limit.`);
            return;
        }

        setAttachments(files.map(f => ({
            type: f.type.startsWith('image') ? 'image' :
                f.type.startsWith('video') ? 'video' : 'file',
            file: f,
            preview: URL.createObjectURL(f),
            fileName: f.name
        })));
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Box
            sx={{
                flexGrow: 1,
                width: 'calc(100vw - 100px)',
                mr: 8,
                height: 'calc(100vh - 70px)',
                backgroundColor: '#1A1A1A',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #666',
                borderRadius: '15px',
            }}
        >
            {/* Header with ConversationItem + search */}
            <Box sx={{ flexShrink: 0, borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, background: "#2A2A2A", borderRadius: '16px 16px 0px 0px' }}>
                <Box sx={{display:'flex', flexDirection:'row'}}>
                    <IconButton>
                        <ArrowBackIcon sx={{ color: 'white', fontSize: '26px', mr:'10px' }} onClick={()=>{setRoom()}} />
                    </IconButton>
                 <Box 
                    sx={{
                        display:'flex', 
                        flexDirection:'row',
                        cursor: room.roomType === 'group' ? 'pointer' : 'default',
                        '&:hover': room.roomType === 'group' ? { opacity: 0.85 } : {}
                    }}
                    onClick={() => {
                        if (room.roomType === 'group') {
                            setViewMembersOpen(true);
                        }
                    }}
                >
                    {/* Left side: room details */}
                    <ConversationItem key={room._id} room={room} isHeader={true} subTitle={getTypingText()} />
                </Box>
            </Box>

                {/* Right side: add member & search box */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {room.roomType === 'group' && currentUser?.role === 'ADMIN' && (
                        <IconButton 
                            onClick={() => setAddMemberOpen(true)}
                            sx={{ color: 'white', '&:hover': { bgcolor: '#444' } }}
                            title="Add Group Member"
                        >
                            <PersonAddIcon />
                        </IconButton>
                    )}
                    {room.roomType === 'group' && currentUser?.role === 'ADMIN' && (
                        <IconButton 
                            onClick={handleCopyInviteLink}
                            sx={{ color: 'white', '&:hover': { bgcolor: '#444' } }}
                            title="Copy Invite Link"
                        >
                            <LinkIcon />
                        </IconButton>
                    )}
                    <input
                        type="text"
                        placeholder="Search messages"
                        style={{
                            width: '200px',          // fixed width so it doesn’t shrink your layout
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#111',
                            color: '#fff',
                        }}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Box>
            </Box>
            {/* Scrollable messages */}
            <Box 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}
            >
                {loadingMore && (
                    <Box sx={{ width: '100%', position: 'sticky', top: 0, zIndex: 1, mb: 1 }}>
                        <LinearProgress sx={{ height: '3px', borderRadius: '2px', bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: '#0af' } }} />
                    </Box>
                )}
                {filteredGroups.map((group) => (
                    <React.Fragment key={group.label}>
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                            <Typography
                                sx={{
                                    color: '#aaa',
                                    fontSize: '0.8rem',
                                }}
                            >
                                {group.label}
                            </Typography>
                        </Box>
                        {group.items.map((msg) => {
                            const parentMsg = msg.parentMessageId
                                ? messages.find(m => m._id === msg.parentMessageId)
                                : null;
                            return (
                                <MessageBubble
                                    key={msg._id}
                                    message={msg}
                                    parentMessage={parentMsg}
                                    roomType={room?.roomType}
                                    roomMembers={room?.members}
                                    currentUser={currentUser}
                                    isSender={msg.sender === currentUserId || msg.sender?._id === currentUserId}
                                    onReply={(m) => setReplyTo(m)}
                                    onReact={handleReact}
                                    onEditMessage={handleEditMessage}
                                    onDeleteMessage={handleDeleteMessage}
                                />
                            );
                        })}
                    </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
            </Box>

            {/* Reply + Attachments preview above input */}
            <Box sx={{ flexShrink: 0, borderTop: '1px solid #444', p: 1 }}>
                {replyTo && (
                    <Box sx={{ bgcolor: '#222', p: 1, mb: 1, borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>
                                Replying to {replyTo.sender?.username}
                            </Typography>
                            <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                                {replyTo.content || (replyTo.mediaUrl && replyTo.mediaUrl.length > 0 ? 'Attachment' : replyTo.attachments?.[0]?.fileName)}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ color: '#fff' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                {attachments.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        {attachments.map((att, idx) => (
                            <Box key={idx} sx={{ position: 'relative' }}>
                                {att.type === 'image' && (
                                    <img src={att.preview} alt={att.fileName} style={{ maxHeight: 80, borderRadius: 8 }} />
                                )}
                                {att.type === 'video' && (
                                    <video src={att.preview} controls style={{ maxHeight: 80, borderRadius: 8 }} />
                                )}
                                {att.type === 'file' && (
                                    <Typography sx={{ color: '#fff' }}>{att.fileName}</Typography>
                                )}
                                {/* Cancel/remove button */}
                                <IconButton
                                    size="small"
                                    sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#000', color: '#fff' }}
                                    onClick={() => removeAttachment(idx)}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Input bar with attach button */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => document.getElementById('fileInput').click()} sx={{ color: '#fff' }}>
                        <AttachFileIcon />
                    </IconButton>
                    <ChatInput
                        onSend={(msg) => {
                            handleSend(msg);
                            setReplyTo(null);
                            setAttachments([]);
                            if (isTypingRef.current) {
                                socket.emit("stopTyping", { roomId: room._id, userId: (currentUser?._id || currentUserId) });
                                isTypingRef.current = false;
                            }
                            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                        }}
                        users={room?.roomType === 'group' ? room?.members : []}
                        hasAttachments={attachments.length > 0}
                        onTyping={handleTyping}
                    />
                </Box>
                <input
                    id="fileInput"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />
            </Box>

            {/* Add Group Member Dialog */}
            <Dialog 
                open={addMemberOpen} 
                onClose={() => { setAddMemberOpen(false); setMemberSearchQuery(''); }} 
                fullWidth 
                maxWidth="xs" 
                slotProps={{
                    paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Add Group Member</Typography>
                    <IconButton size="small" onClick={() => { setAddMemberOpen(false); setMemberSearchQuery(''); }} sx={{ color: '#fff' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search by name or email..."
                        variant="outlined"
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                        sx={{
                            mt: 1,
                            '& .MuiOutlinedInput-root': {
                                '& input': { color: '#f0f0f0' },
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                            },
                            '& .MuiInputBase-input::placeholder': { color: '#aaa', opacity: 1 }
                        }}
                    />
                    {searchingUsers && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 2, color: '#a3f96d' }} />}
                    <List sx={{ mt: 1, maxHeight: '250px', overflowY: 'auto' }}>
                        {foundUsers.map(user => (
                            <ListItem 
                                button 
                                key={user._id} 
                                onClick={() => handleAddMember(user._id)} 
                                sx={{ '&:hover': { bgcolor: '#2A2A2A' }, borderRadius: '8px', mb: 0.5 }}
                            >
                                <ListItemAvatar>
                                    <Avatar src={user.profilePicture}>{user.firstName[0]}</Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={`${user.firstName} ${user.lastName}`} 
                                    secondary={user.email} 
                                    slotProps={{ primary: { sx: { color: '#f0f0f0', fontWeight: 'bold' } }, secondary: { sx: { color: '#fff' } } }}
                                />
                            </ListItem>
                        ))}
                        {!searchingUsers && memberSearchQuery.trim() && foundUsers.length === 0 && (
                            <Typography sx={{ color: '#bbb', fontStyle: 'italic', textAlign: 'center', mt: 2 }}>No users found or already in group</Typography>
                        )}
                    </List>
                </DialogContent>
            </Dialog>

            {/* View Group Members Dialog */}
            <Dialog 
                open={viewMembersOpen} 
                onClose={() => setViewMembersOpen(false)} 
                fullWidth 
                maxWidth="xs" 
                slotProps={{
                    paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' } }
                }}
            >
                <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Group Members</Typography>
                    <IconButton size="small" onClick={() => setViewMembersOpen(false)} sx={{ color: '#fff' }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 2, maxHeight: '350px', overflowY: 'auto' }}>
                    {/* Group Icon Change (Admin only) */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, pb: 2, borderBottom: '1px solid #444' }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar 
                                src={room.roomProfile || room.profilePic} 
                                alt={room.roomName || room.name} 
                                sx={{ width: 80, height: 80, fontSize: '2.2rem', bgcolor: '#1c34bb', color: '#fff' }}
                            >
                                {(room.roomName || room.name) ? (room.roomName || room.name)[0] : ''}
                            </Avatar>
                            {currentUser?.role === 'ADMIN' && (
                                <>
                                    <IconButton
                                        onClick={() => document.getElementById('groupIconInput').click()}
                                        sx={{ 
                                            position: 'absolute', 
                                            bottom: -4, 
                                            right: -4, 
                                            bgcolor: '#1c34bb', 
                                            color: '#fff', 
                                            width: 28, 
                                            height: 28,
                                            border: '2px solid #1A1A1A',
                                            '&:hover': { bgcolor: '#152999' } 
                                        }}
                                        size="small"
                                        title="Change Group Icon"
                                    >
                                        <EditIcon fontSize="small" style={{ fontSize: '0.9rem' }} />
                                    </IconButton>
                                    <input 
                                        id="groupIconInput" 
                                        type="file" 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                        onChange={handleGroupIconChange} 
                                    />
                                </>
                            )}
                        </Box>
                        {uploadingGroupIcon && (
                            <CircularProgress size={20} sx={{ mt: 1, color: '#a3f96d' }} />
                        )}
                        
                        {isEditingName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, width: '80%' }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& input': { color: '#f0f0f0', py: 0.8 },
                                            '& fieldset': { borderColor: '#444' },
                                            '&:hover fieldset': { borderColor: '#666' },
                                            '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                                        }
                                    }}
                                    disabled={updatingGroupName}
                                />
                                <Button 
                                    size="small" 
                                    onClick={() => setIsEditingName(false)} 
                                    sx={{ color: '#ccc', textTransform: 'none', minWidth: 'fit-content' }}
                                    disabled={updatingGroupName}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    size="small" 
                                    variant="contained" 
                                    onClick={handleUpdateGroupName} 
                                    sx={{ bgcolor: '#a3f96d', color: '#000', textTransform: 'none', fontWeight: 'bold', minWidth: 'fit-content', '&:hover': { bgcolor: '#8ee05c' } }}
                                    disabled={updatingGroupName}
                                >
                                    {updatingGroupName ? 'Saving...' : 'Save'}
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#fff' }}>
                                    {room.roomName || room.name}
                                </Typography>
                                {currentUser?.role === 'ADMIN' && (
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setEditNameValue(room.roomName || room.name || '');
                                            setIsEditingName(true);
                                        }}
                                        sx={{ color: '#aaa', '&:hover': { color: '#fff' } }}
                                        title="Edit Group Name"
                                    >
                                        <EditIcon fontSize="small" style={{ fontSize: '1rem' }} />
                                    </IconButton>
                                )}
                            </Box>
                        )}
                    </Box>

                    <List sx={{ py: 0 }}>
                        {room.members?.map((member, idx) => {
                            const name = member.firstName 
                                ? `${member.firstName} ${member.lastName}` 
                                : member.username || 'User';
                            const email = member.email || '';
                            const avatar = member.profilePicture || member.profilePic || '';
                            
                            return (
                                <ListItem 
                                    key={idx} 
                                    sx={{ borderBottom: '1px solid #444', '&:last-child': { border: 'none' }, py: 1 }}
                                    secondaryAction={
                                        currentUser?.role === 'ADMIN' && (member._id || member).toString() !== currentUserId?.toString() && (
                                            <IconButton 
                                                edge="end" 
                                                aria-label="delete" 
                                                onClick={() => handleDeleteMember(member._id || member)}
                                                sx={{ color: '#ff4444', '&:hover': { color: '#ff6666' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar src={avatar}>{name[0]}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={name} 
                                        secondary={email} 
                                        slotProps={{ primary: { sx: { color: '#f0f0f0', fontWeight: 'bold' } }, secondary: { sx: { color: '#fff' } } }}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default ChatWindow;