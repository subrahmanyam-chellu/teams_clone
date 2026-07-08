import React from 'react';
import { Box, Typography } from '@mui/material';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import ConversationItem from './ConversationItem';

const ChatWindow = ({ room, messages, currentUserId }) => {
    if (!room._id) {
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
            dayLabel = format(msgDate, 'MMMM d, yyyy'); // e.g. July 8, 2026
        }

        const lastGroup = grouped[grouped.length - 1];
        if (lastGroup && isSameDay(new Date(lastGroup.date), msgDate)) {
            lastGroup.items.push(msg);
        } else {
            grouped.push({ date: msgDate, label: dayLabel, items: [msg] });
        }
    });

    return (
        <Box
            sx={{
                flexGrow: 1,
                width: 'calc(100vw - 100px)',
                mr: 8,
                overflowY: 'auto',
                height: 'calc(100vh - 70px)',
                backgroundColor: '#1A1A1A',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #666',
                borderRadius: '15px',
                position: 'static',
                alignContent: 'space-between'
            }}
        >
            <Box sx={{ flexShrink: 0, borderBottom: '1px solid #444' }}>
                <ConversationItem key={room._id} room={room} isNew={room.isNew} />
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {grouped.map((group) => (
                    <React.Fragment key={group.label}>
                        {/* Day separator */}
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                            <Typography
                                sx={{
                                    color: '#aaa',
                                    fontSize: '0.8rem',
                                    px: 1,
                                    py: 0.25
                                }}
                            >
                                {group.label}
                            </Typography>
                        </Box>

                        {/* Messages for that day */}
                        {group.items.map((msg) => (
                            <MessageBubble
                                key={msg._id}
                                message={msg}
                                isSender={msg.senderId === currentUserId}
                                onReply={(m) => console.log('Reply to:', m)}
                                onReact={(m, emoji) => console.log('React:', emoji, 'to', m)}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </Box>
            <Box sx={{ flexShrink: 0, borderTop: '1px solid #444' }}>
                <ChatInput onSend={(msg) => console.log('Send message:', msg)} />
            </Box>
        </Box>
    );
};

export default ChatWindow;
