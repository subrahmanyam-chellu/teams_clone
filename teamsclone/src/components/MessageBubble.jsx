import React from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReplyIcon from '@mui/icons-material/Reply';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

const MessageBubble = ({ message, isSender, onReply, onReact }) => {
  const handleDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.click();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        mb: 2,
        justifyContent: isSender ? 'flex-end' : 'flex-start', // ✅ align bubble
      }}
    >
      {/* Avatar always on left */}
      <Avatar
        src={message.sender?.profilePic}
        alt={message.sender?.username}
        sx={{ mr: 1 }}
      >
        {message.sender?.username?.[0]}
      </Avatar>

      {/* Bubble */}
      <Box
        sx={{
          maxWidth: '65%',
          p: 1.5,
          borderRadius: 2,
          bgcolor: isSender ? 'primary.main' : '#333',
          color: '#fff',
        }}
      >
        {/* Sender name (group only) */}
        {message.roomType === 'group' && (
          <Typography sx={{ fontSize: '0.75rem', color: '#aaa', mb: 0.5 }}>
            {message.sender?.username}
          </Typography>
        )}

        {/* Text */}
        {message.text && <Typography>{message.text}</Typography>}

        {/* Attachments */}
        {message.attachments?.map((att, idx) => (
          <Box key={idx} sx={{ mt: 1 }}>
            {att.type === 'image' && (
              <img
                src={att.url}
                alt={att.fileName}
                style={{ maxWidth: '200px', borderRadius: '8px' }}
              />
            )}
            {att.type === 'video' && (
              <video
                src={att.url}
                controls
                style={{ maxWidth: '300px', borderRadius: '8px' }}
              />
            )}
            {att.type === 'file' && (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0af' }}
              >
                {att.fileName}
              </a>
            )}
            <IconButton
              size="small"
              sx={{ color: '#fff', ml: 1 }}
              onClick={() => handleDownload(att.url, att.fileName)}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}

        {/* Reactions display */}
        {message.reactions?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            {message.reactions.map((r, idx) => (
              <span key={idx}>{r.emoji}</span>
            ))}
          </Box>
        )}

        {/* Time + Status */}
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: '#ccc',
            mt: 0.5,
            textAlign: 'right',
          }}
        >
          {formatTime(message.createdAt)}{' '}
          {isSender && (message.readReceipts?.length > 0 ? '• Read' : '• Delivered')}
        </Typography>

        {/* Reply + React options */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <IconButton size="small" onClick={() => onReply?.(message)}>
            <ReplyIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onReact?.(message, '👍')}>
            <ThumbUpAltIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onReact?.(message, '❤️')}>
            <FavoriteIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onReact?.(message, '😊')}>
            <SentimentSatisfiedAltIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageBubble;

