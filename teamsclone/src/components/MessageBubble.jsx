import React from 'react';
import { Box, Typography, Avatar, IconButton, Popover, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import CloseIcon from '@mui/icons-material/Close';

const getAttachmentsFromMediaUrl = (mediaUrls) => {
  if (!mediaUrls || !Array.isArray(mediaUrls)) return [];
  return mediaUrls.map(url => {
    let type = 'file';
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || url.includes('/image/upload/')) {
      type = 'image';
    } else if (url.match(/\.(mp4|webm|ogg|mov|avi)/i) || url.includes('/video/upload/')) {
      type = 'video';
    }
    
    let fileName = 'Attachment';
    try {
      const parts = url.split('/');
      fileName = parts[parts.length - 1];
    } catch (e) {}

    return { type, url, fileName };
  });
};

const MessageBubble = ({ message, parentMessage, roomType, roomMembers, currentUser, isSender, onReply, onReact }) => {
  const attachmentsList = message.attachments || getAttachmentsFromMediaUrl(message.mediaUrl);
  
  // Popover and Dialog states
  const [reactionAnchorEl, setReactionAnchorEl] = React.useState(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [readRecipientsOpen, setReadRecipientsOpen] = React.useState(false);

  const resolveReceiptUser = (receipt) => {
    const rawId = (receipt.userId?._id || receipt.userId)?.toString();
    const currentId = (currentUser?._id || currentUser?.id)?.toString();
    if (rawId && currentId && rawId === currentId) {
      return {
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'Me',
        email: currentUser.email || '',
        avatar: currentUser.profilePicture || currentUser.profilePic || ''
      };
    }

    const member = roomMembers?.find(m => {
      const mId = (m._id || m)?.toString();
      return mId === rawId;
    });

    if (member) {
      return {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || 'User',
        email: member.email || '',
        avatar: member.profilePicture || member.profilePic || ''
      };
    }

    return {
      name: 'User',
      email: '',
      avatar: ''
    };
  };

  const formatReadTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `Seen at ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

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

  const resolveReactionUser = (r) => {
    const rawId = r.userId?._id || r.userId || r.sender?._id || r.sender;
    const currentId = currentUser?._id || currentUser?.id;
    if (rawId === currentId) {
      return {
        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'Me',
        email: currentUser.email || '',
        avatar: currentUser.profilePicture || currentUser.profilePic || ''
      };
    }

    const member = roomMembers?.find(m => {
      const mId = m._id?.toString() || m?.toString();
      return mId === rawId;
    });

    if (member) {
      return {
        name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || 'User',
        email: member.email || '',
        avatar: member.profilePicture || member.profilePic || ''
      };
    }

    return {
      name: 'User',
      email: '',
      avatar: ''
    };
  };

  // Group reactions by emoji type
  const emojiGroups = {};
  message.reactions?.forEach(r => {
    if (r.emoji) {
      emojiGroups[r.emoji] = (emojiGroups[r.emoji] || 0) + 1;
    }
  });

  return (
    <Box
      id={`msg-${message._id}`}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        mb: 2,
        justifyContent: isSender ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Avatar only for received messages in groups */}
      {!isSender && (roomType === 'group' || message.roomType === 'group') && (
        <Avatar
          src={message.sender?.profilePic}
          alt={message.sender?.username}
          sx={{ mr: 1 }}
        >
          {message.sender?.username?.[0]}
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
        {(message.replyTo || parentMessage) && (() => {
          const original = parentMessage || message.replyTo;
          const senderName = original.sender?.firstName
            ? `${original.sender.firstName} ${original.sender.lastName}`
            : original.sender?.username || 'Reply';
          const textContent = original.content || original.text || '';
          const hasMedia = (original.mediaUrl && original.mediaUrl.length > 0) || (original.attachments && original.attachments.length > 0);

          return (
            <Box
              sx={{
                bgcolor: '#222',
                p: 1,
                mb: 1,
                borderLeft: '3px solid white',
                borderRadius: 1,
                cursor: 'pointer',
                opacity: 0.85,
                '&:hover': { opacity: 1 }
              }}
              onClick={() => {
                const element = document.getElementById(`msg-${original._id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', color: 'white', fontWeight: 'bold' }}>
                {senderName}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {textContent || (hasMedia ? 'Attachment' : 'Message')}
              </Typography>
            </Box>
          );
        })()}

        {/* Deleted message */}
        {message.deleted ? (
          <Typography sx={{ fontStyle: 'italic', color: '#888' }}>
            This message was deleted
          </Typography>
        ) : (
          <>
            {/* Sender name (group only) */}
            {(roomType === 'group' || message.roomType === 'group') && (
              <Typography
                sx={{ fontSize: '0.75rem', color: '#aaa', mb: 0.5 }}
              >
                {message.sender?.firstName
                  ? `${message.sender.firstName} ${message.sender.lastName}`
                  : message.sender?.username}
              </Typography>
            )}

            {/* Text */}
            {message.content && <Typography>{message.content}</Typography>}

            {/* Attachments */}
            {attachmentsList.map((att, idx) => (
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
                    <Typography sx={{ color: '#0af', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '150px' }}>
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

        {/* Reactions Summary Pill */}
        {message.reactions?.length > 0 && (
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.5, 
              mt: 1, 
              bgcolor: '#222', 
              borderRadius: '12px', 
              py: 0.3,
              px: 0.8, 
              width: 'fit-content',
              cursor: 'pointer',
              border: '1px solid #444',
              '&:hover': { bgcolor: '#2e2e2e' }
            }}
            onClick={() => setDetailsOpen(true)}
          >
            {Object.entries(emojiGroups).map(([emoji, count]) => (
              <Box key={emoji} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mr: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem' }}>{emoji}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>{count}</Typography>
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
          {isSender && (
            <Typography
              component="span"
              onClick={() => {
                const isGroup = roomType === 'group' || message.roomType === 'group';
                if (isGroup && message.readReceipts?.length > 0) {
                  setReadRecipientsOpen(true);
                }
              }}
              sx={{
                fontSize: '0.7rem',
                cursor: (roomType === 'group' || message.roomType === 'group') && message.readReceipts?.length > 0 ? 'pointer' : 'default',
                '&:hover': (roomType === 'group' || message.roomType === 'group') && message.readReceipts?.length > 0 ? { textDecoration: 'underline' } : {},
                color: '#ccc',
                ml: 0.5
              }}
            >
              {message.readReceipts?.length > 0 ? '• Read' : '• Delivered'}
            </Typography>
          )}
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
              onClick={(e) => setReactionAnchorEl(e.currentTarget)}
              sx={{ color: '#fff' }}
            >
              <SentimentSatisfiedAltIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Floating Reactions Selector popover */}
      <Popover
        open={Boolean(reactionAnchorEl)}
        anchorEl={reactionAnchorEl}
        onClose={() => setReactionAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: isSender ? 'right' : 'left'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: isSender ? 'right' : 'left'
        }}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#222',
              borderRadius: '20px',
              p: 0.5,
              border: '1px solid #444',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              display: 'flex',
              gap: 0.5
            }
          }
        }}
      >
        {['👍', '👎', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
          <IconButton
            key={emoji}
            size="small"
            onClick={() => {
              onReact?.(message, emoji);
              setReactionAnchorEl(null);
            }}
            sx={{
              fontSize: '1.25rem',
              p: 0.8,
              borderRadius: '50%',
              '&:hover': { transform: 'scale(1.25)', transition: 'transform 0.1s', bgcolor: '#333' }
            }}
          >
            {emoji}
          </IconButton>
        ))}
      </Popover>

      {/* Reactions Detail Dialog List */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: { bgcolor: '#222', color: '#fff', borderRadius: '15px', border: '1px solid #444' }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Message Reactions</Typography>
          <IconButton size="small" onClick={() => setDetailsOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, maxHeight: '300px', overflowY: 'auto' }}>
          <List sx={{ py: 0 }}>
            {message.reactions?.map((r, idx) => {
              const profile = resolveReactionUser(r);
              return (
                <ListItem key={idx} sx={{ borderBottom: '1px solid #333', '&:last-child': { border: 'none' }, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={profile.avatar}>{profile.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={profile.name} 
                    primaryTypographyProps={{ sx: { color: '#fff', fontWeight: 'bold' } }}
                    secondary={profile.email} 
                    secondaryTypographyProps={{ sx: { color: '#fff', fontSize: '0.75rem', opacity: 0.9 } }} 
                  />
                  <Typography sx={{ fontSize: '1.5rem', ml: 2 }}>
                    {r.emoji}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>

      {/* Read Recipients Detail Dialog List */}
      <Dialog 
        open={readRecipientsOpen} 
        onClose={() => setReadRecipientsOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: { bgcolor: '#222', color: '#fff', borderRadius: '15px', border: '1px solid #444' }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Message Read By</Typography>
          <IconButton size="small" onClick={() => setReadRecipientsOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, maxHeight: '300px', overflowY: 'auto' }}>
          <List sx={{ py: 0 }}>
            {message.readReceipts?.map((r, idx) => {
              const profile = resolveReceiptUser(r);
              return (
                <ListItem key={idx} sx={{ borderBottom: '1px solid #333', '&:last-child': { border: 'none' }, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={profile.avatar}>{profile.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={profile.name} 
                    primaryTypographyProps={{ sx: { color: '#fff', fontWeight: 'bold' } }}
                    secondary={formatReadTime(r.readAt)} 
                    secondaryTypographyProps={{ sx: { color: '#fff', fontSize: '0.75rem', opacity: 0.9 } }} 
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

export default MessageBubble;
