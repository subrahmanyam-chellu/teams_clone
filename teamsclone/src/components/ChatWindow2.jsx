import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import ConversationItem from './ConversationItem';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';

const ChatWindow2 = ({ room, messages, currentUserId }) => {
    const [replyTo, setReplyTo] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    if (!room?._id) {
        return (
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid #666',
                    borderRadius: '15px',
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
        const msgDate = new Date(msg.createdAt);
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
            msg.text?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }));

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
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
            <Box sx={{ flexShrink: 0, borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px:2 }}>
                {/* Left side: room details */}
                <ConversationItem key={room._id} room={room} isNew={room.isNew} />

                {/* Right side: search box */}
                <input
                    type="text"
                    placeholder="Search messages"
                    style={{
                        width: '200px',          // fixed width so it doesn’t shrink your layout
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#333',
                        color: '#fff',
                    }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>
            {/* Scrollable messages */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
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
                        {group.items.map((msg) => (
                            <MessageBubble
                                key={msg._id}
                                message={msg}
                                isSender={msg.senderId === currentUserId}
                                onReply={(m) => setReplyTo(m)}
                                onReact={(m, emoji) => console.log('React:', emoji, 'to', m)}
                            />
                        ))}
                    </React.Fragment>
                ))}
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
                                {replyTo.text || replyTo.attachments?.[0]?.fileName}
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
                                {/* ✅ Cancel/remove button */}
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
                            console.log('Send message:', msg, 'replying to:', replyTo, 'attachments:', attachments);
                            setReplyTo(null);
                            setAttachments([]);
                        }}
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
        </Box>
    );
};

export default ChatWindow2;