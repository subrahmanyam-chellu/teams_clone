import React from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReplyIcon from '@mui/icons-material/Reply';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

const MessageBubble2 = ({ message, isSender, onReply, onReact }) => {
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
        justifyContent: isSender ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Avatar only for received messages in 1-to-1 */}
      {!isSender && (
        <Avatar
          src={message.sender?.profilePicture}
          alt={message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : "User Profile"}
          sx={{ mr: 1, bgcolor: '#a3f96d', color: '#000', fontWeight: 'bold' }}
        >
          {message.sender ? `${message.sender.firstName?.[0]?.toUpperCase() || ''}${message.sender.lastName?.[0]?.toUpperCase() || ''}` : '?'}
        </Avatar>
      )}

      {/* Bubble */}
      <Box
        sx={{
          maxWidth: '65%',
          p: 1.5,
          borderRadius: 2,
          bgcolor: message.deleted
            ? '#222'
            : isSender
            ? '#1c34bb'
            : '#333',
          color: '#fff',
        }}
      >
        {/* Reply preview */}
        {message.replyTo && (
          <Box
            sx={{
              bgcolor: '#222',
              p: 1,
              mb: 1,
              borderLeft: '3px solid white',
              borderRadius: 1,
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', color: '#aaa' }}>
              {message.replyTo.sender?.username || 'Reply'}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#fff' }}>
              {message.replyTo.text ||
                message.replyTo.attachments?.[0]?.fileName}
            </Typography>
          </Box>
        )}

        {/* Deleted message */}
        {message.deleted ? (
          <Typography sx={{ fontStyle: 'italic', color: '#888' }}>
            This message was deleted
          </Typography>
        ) : (
          <>
            {/* Sender name (group only) */}
            {message.roomType === 'group' && (
              <Typography
                sx={{ fontSize: '0.75rem', color: '#aaa', mb: 0.5 }}
              >
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
                    style={{
                      maxWidth: '200px',
                      borderRadius: '8px',
                    }}
                  />
                )}
                {att.type === 'video' && (
                  <video
                    src={att.url}
                    controls
                    style={{
                      maxWidth: '300px',
                      borderRadius: '8px',
                    }}
                  />
                )}
                {att.type === 'file' && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: '#222',
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Typography sx={{ color: '#0af' }}>
                      {att.fileName}
                    </Typography>
                    <IconButton
                      size="small"
                      sx={{ color: '#fff', ml: 1 }}
                      onClick={() =>
                        handleDownload(att.url, att.fileName)
                      }
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ))}

            {/* Edited indicator */}
            {message.edited && (
              <Typography
                sx={{ fontSize: '0.7rem', color: '#aaa', mt: 0.5 }}
              >
                (edited)
              </Typography>
            )}
          </>
        )}

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            {message.reactions.map((r, idx) => (
              <Box
                key={idx}
                sx={{ bgcolor: '#444', px: 1, borderRadius: 2 }}
              >
                {r.emoji}
              </Box>
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
          {isSender &&
            (message.readReceipts?.length > 0
              ? '• Read'
              : '• Delivered')}
        </Typography>

        {/* Reply + React options */}
        {!message.deleted && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <IconButton
              size="small"
              onClick={() => onReply?.(message)}
              sx={{ color: '#fff' }}
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onReact?.(message, '👍')}
              sx={{ color: '#fff' }}
            >
              <ThumbUpAltIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onReact?.(message, '❤️')}
              sx={{ color: '#fff' }}
            >
              <FavoriteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onReact?.(message, '😊')}
              sx={{ color: '#fff' }}
            >
              <SentimentSatisfiedAltIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageBubble2;
