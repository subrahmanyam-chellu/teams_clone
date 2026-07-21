import React from 'react';
import { Box, Typography, Avatar, IconButton, Popover, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemAvatar, ListItemText, TextField, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReplyIcon from '@mui/icons-material/Reply';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';

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

const MessageBubble = ({ message, parentMessage, roomType, roomMembers, currentUser, isSender, onReply, onReact, onEditMessage, onDeleteMessage, onJoinCall }) => {
  const attachmentsList = message.attachments || getAttachmentsFromMediaUrl(message.mediaUrl);
  
  // Popover and Dialog states
  const [reactionAnchorEl, setReactionAnchorEl] = React.useState(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [readRecipientsOpen, setReadRecipientsOpen] = React.useState(false);

  // Edit states
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(message.content || '');

  React.useEffect(() => {
    setEditContent(message.content || '');
  }, [message.content]);

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      alert("Message content cannot be empty.");
      return;
    }
    onEditMessage?.(message._id, editContent);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message?")) {
      onDeleteMessage?.(message._id);
    }
  };

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

             {/* Text / Edit field */}
             {isEditing ? (
               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1, minWidth: '200px' }}>
                 <TextField
                   fullWidth
                   multiline
                   size="small"
                   variant="outlined"
                   value={editContent}
                   onChange={(e) => setEditContent(e.target.value)}
                   sx={{
                     '& .MuiOutlinedInput-root': {
                       '& textarea': { color: '#f0f0f0', fontSize: '0.9rem' },
                       '& fieldset': { borderColor: '#444' },
                       '&:hover fieldset': { borderColor: '#666' },
                       '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                     }
                   }}
                 />
                 <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                   <Button size="small" onClick={() => setIsEditing(false)} sx={{ color: '#ccc', textTransform: 'none' }}>Cancel</Button>
                   <Button size="small" variant="contained" onClick={handleSaveEdit} sx={{ bgcolor: '#a3f96d', color: '#000', textTransform: 'none', fontWeight: 'bold', '&:hover': { bgcolor: '#8ee05c' } }}>Save</Button>
                 </Box>
               </Box>
              ) : message.isCallMessage ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 1.5, 
                    p: 1.5, 
                    bgcolor: '#222', 
                    borderRadius: '10px', 
                    border: '1px solid #444',
                    minWidth: '220px',
                    mt: 0.5
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'rgba(163, 249, 109, 0.2)', color: '#a3f96d', width: 36, height: 36 }}>
                      <VideocamIcon style={{ fontSize: '1.2rem' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                        Video Call
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        Started a call
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    onClick={onJoinCall}
                    sx={{
                      bgcolor: '#a3f96d',
                      color: '#000',
                      fontWeight: 'bold',
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      py: 0.5,
                      '&:hover': { bgcolor: '#8ee05c' }
                    }}
                  >
                    Join Meeting
                  </Button>
                </Box>
              ) : (
                message.content && <Typography>{message.content}</Typography>
              )}

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

        {/* Reply + React options + Edit/Delete */}
        {!message.deleted && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onReply?.(message)}
              sx={{ color: '#fff' }}
              title="Reply"
            >
              <ReplyIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => setReactionAnchorEl(e.currentTarget)}
              sx={{ color: '#fff' }}
              title="React"
            >
              <SentimentSatisfiedAltIcon fontSize="small" />
            </IconButton>

            {/* Show edit button to sender or super admin */}
            {(isSender || currentUser?.role === 'SUPER_ADMIN') && (
              <IconButton
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{ color: '#fff', '&:hover': { color: '#a3f96d' } }}
                title="Edit"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}

            {/* Show delete button to sender, admin, or super admin */}
            {(isSender || currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ color: '#fff', '&:hover': { color: '#ff4444' } }}
                title="Delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
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
            sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Message Reactions</Typography>
          <IconButton size="small" onClick={() => setDetailsOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, maxHeight: '300px', overflowY: 'auto' }}>
          <List sx={{ py: 0 }}>
            {message.reactions?.map((r, idx) => {
              const profile = resolveReactionUser(r);
              return (
                <ListItem key={idx} sx={{ borderBottom: '1px solid #444', '&:last-child': { border: 'none' }, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={profile.avatar}>{profile.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={profile.name} 
                    secondary={profile.email} 
                    slotProps={{ primary: { sx: { color: '#f0f0f0', fontWeight: 'bold' } }, secondary: { sx: { color: '#fff' } } }}
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
            sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #666' }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1c34bb', py: 1.5, px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>Message Read By</Typography>
          <IconButton size="small" onClick={() => setReadRecipientsOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, maxHeight: '300px', overflowY: 'auto' }}>
          <List sx={{ py: 0 }}>
            {message.readReceipts?.map((r, idx) => {
              const profile = resolveReceiptUser(r);
              return (
                <ListItem key={idx} sx={{ borderBottom: '1px solid #444', '&:last-child': { border: 'none' }, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={profile.avatar}>{profile.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={profile.name} 
                    secondary={formatReadTime(r.readAt)} 
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

export default MessageBubble;
