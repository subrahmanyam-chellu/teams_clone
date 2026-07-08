// import React from 'react'
// import MainLayout from '../../layouts/MainLayout'
// import TeamsLayout from '../../components/TeamsLayout'
// import { Box } from '@mui/material'

// const ChatPage = () => {
//   return (
//     <MainLayout>
//         <Box sx={{ display: 'flex', height: '100%', backgroundColor: '#1A1A1A' }}>
//             <TeamsLayout />
//         </Box>
//     </MainLayout>
//   )
// }

// export default ChatPage

import React, { useState } from 'react';
import { Box } from '@mui/material';
import MainLayout from '../../layouts/MainLayout';
import ChatWindow from '../../components/ChatWindow';
import ChatInput from '../../components/ChatInput';
import ConversationsList from '../../components/ConversationsList';

const ChatPage = () => {
    const [messages, setMessages] = useState([
        {
            _id: "m1",
            roomType: "one-to-one",
            senderId: "alice",
            sender: {
                username: "Alice",
                profilePic: "https://i.pravatar.cc/150?img=1",
            },
            text: "Hey Bob! How are you?",
            createdAt: "2026-07-08T10:15:00",
            attachments: [],
            reactions: [{ emoji: "👍" }],
            readReceipts: ["bob"],
            edited: false,
            deleted: false,
            replyTo: null,
        },
        {
            _id: "m2",
            roomType: "one-to-one",
            senderId: "bob",
            sender: {
                username: "Bob",
                profilePic: "https://i.pravatar.cc/150?img=2",
            },
            text: "I'm good @Alice, check this photo!",
            createdAt: "2026-07-08T10:17:00",
            attachments: [
                {
                    type: "image",
                    url: "https://placekitten.com/300/200",
                    fileName: "cute-kitten.jpg",
                },
            ],
            reactions: [{ emoji: "❤️" }],
            readReceipts: ["alice"],
            edited: false,
            deleted: false,
            replyTo: null,
        },
        {
            _id: "m3",
            roomType: "one-to-one",
            senderId: "alice",
            sender: {
                username: "Alice",
                profilePic: "https://i.pravatar.cc/150?img=1",
            },
            text: "Here’s a video reply",
            createdAt: "2026-07-08T10:20:00",
            attachments: [
                {
                    type: "video",
                    url: "https://www.w3schools.com/html/mov_bbb.mp4",
                    fileName: "sample-video.mp4",
                },
            ],
            reactions: [],
            readReceipts: [],
            edited: true, // edited message
            deleted: false,
            replyTo: {
                _id: "m2",
                text: "I'm good @Alice, check this photo!",
            },
        },
        {
            _id: "m4",
            roomType: "one-to-one",
            senderId: "bob",
            sender: {
                username: "Bob",
                profilePic: "https://i.pravatar.cc/150?img=2",
            },
            text: "",
            createdAt: "2026-07-08T10:25:00",
            attachments: [
                {
                    type: "file",
                    url: "https://example.com/document.pdf",
                    fileName: "project-doc.pdf",
                },
            ],
            reactions: [],
            readReceipts: [],
            edited: false,
            deleted: true, // deleted message
            replyTo: null,
        },
    ]
    );

    const handleSend = (msg) => {
        // Save to DB here (via API call)
        const newMessage = {
            _id: Date.now(),
            senderId: 'me',
            text: msg.text,
            attachments: msg.attachments,
            reactions: [],
            readReceipts: [],
        };
        setMessages([...messages, newMessage]);
    };

    const rooms = [
        {
            _id: "room1",
            name: "Alice & Bob",
            profilePic: "https://i.pravatar.cc/150?img=3",
            lastMessage: "Hey Bob! How are you?",
            isNew: true,
        },
        {
            _id: "room2",
            name: "Team Project",
            profilePic: "https://i.pravatar.cc/150?img=4",
            lastMessage: "Meeting at 5 PM",
            isNew: false,
        },
        {
            _id: "room3",
            name: "Family Group",
            profilePic: "https://i.pravatar.cc/150?img=5",
            lastMessage: "Dinner is ready 🍲",
            isNew: true,
        },
        {
            _id: "room1",
            name: "Alice & Bob",
            profilePic: "https://i.pravatar.cc/150?img=3",
            lastMessage: "Hey Bob! How are you?",
            isNew: true,
        },
        {
            _id: "room2",
            name: "Team Project",
            profilePic: "https://i.pravatar.cc/150?img=4",
            lastMessage: "Meeting at 5 PM",
            isNew: false,
        },
        {
            _id: "room3",
            name: "Family Group",
            profilePic: "https://i.pravatar.cc/150?img=5",
            lastMessage: "Dinner is ready 🍲",
            isNew: true,
        },{
            _id: "room1",
            name: "Alice & Bob",
            profilePic: "https://i.pravatar.cc/150?img=3",
            lastMessage: "Hey Bob! How are you?",
            isNew: true,
        },
        {
            _id: "room2",
            name: "Team Project",
            profilePic: "https://i.pravatar.cc/150?img=4",
            lastMessage: "Meeting at 5 PM",
            isNew: false,
        },
        {
            _id: "room3",
            name: "Family Group",
            profilePic: "https://i.pravatar.cc/150?img=5",
            lastMessage: "Dinner is ready 🍲",
            isNew: true,
        },{
            _id: "room1",
            name: "Alice & Bob",
            profilePic: "https://i.pravatar.cc/150?img=3",
            lastMessage: "Hey Bob! How are you?",
            isNew: true,
        },
        {
            _id: "room2",
            name: "Team Project",
            profilePic: "https://i.pravatar.cc/150?img=4",
            lastMessage: "Meeting at 5 PM",
            isNew: false,
        },
        {
            _id: "room3",
            name: "Family Group",
            profilePic: "https://i.pravatar.cc/150?img=5",
            lastMessage: "Dinner is ready 🍲",
            isNew: true,
        },
    ];


    return (
        <MainLayout>
            <Box sx={{ width: '100vw', display: 'flex', flexDirection: 'row', maxHeight: '100%', marginLeft: '1px', position: 'fixed', p: 1, mx:0, gap: 2 }}>
                <ConversationsList rooms={rooms} />
                <ChatWindow messages={messages} room={rooms[0]} currentUserId="alice" />
            </Box>
        </MainLayout>
    );
};

export default ChatPage;

