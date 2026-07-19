import React, { useState } from 'react';
import { Box, TextField, IconButton, Popper, List, ListItem, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const ChatInput = ({ onSend, users, hasAttachments, onTyping }) => {
  const [text, setText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    onTyping?.(value.length > 0);

    // Detect @mention
    const match = value.match(/@(\w*)$/);
    if (match && users && Array.isArray(users)) {
      const query = match[1].toLowerCase();
      const results = users.filter(u => {
        if (!u) return false;
        const username = (u.username || '').toLowerCase();
        const firstName = (u.firstName || '').toLowerCase();
        const lastName = (u.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        return username.startsWith(query) || firstName.startsWith(query) || lastName.startsWith(query) || fullName.startsWith(query);
      });
      setFilteredUsers(results);
      setAnchorEl(e.currentTarget);
    } else {
      setFilteredUsers([]);
      setAnchorEl(null);
    }
  };

  const handleSelectUser = (user) => {
    const name = user.username || `${user.firstName || ''}${user.lastName || ''}`.trim() || 'user';
    const newText = text.replace(/@\w*$/, `@${name} `);
    setText(newText);
    setFilteredUsers([]);
    setAnchorEl(null);
  };

  const handleSend = () => {
    if (text.trim() || hasAttachments) {
      onSend({ content: text, text, attachments: [] });
      setText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'transparent',
      width: '100%',
      borderRadius: '15px'
    }}>
      {/* <TextField
        value={text}
        onChange={handleChange}
        placeholder="Type a message"
        variant="outlined"
        fullWidth
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            '& input': { color: 'white', backgroundColor:'white' },
            '& fieldset': { borderColor: '#555', bgcolor: '#111', borderRadius: '15px' },
            '&:hover fieldset': { borderColor: '#888' },
            '&.Mui-focused fieldset': { borderColor: '#666' },
            '& .MuiInputBase-input': {
              color: 'white',      // ✅ placeholder gray
              opacity: 1,
            },
          },
          
        }}
      /> */}
      <input  value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message"
        variant="outlined"
        fullWidth
        size="small" style={{ background:'#222', border:'1px solid  #666', width:'100%', height
          :'40px', borderRadius:'15px', color:'white', fontSize:'18px', fontFamily:'sans-serif'
        }}>
      </input>
      <IconButton sx={{ ml: 1, color: '#fff' }} onClick={handleSend}>
        <SendIcon />
      </IconButton>

      {/* Mentions dropdown */}
      <Popper open={filteredUsers.length > 0} anchorEl={anchorEl} placement="top-start" sx={{ zIndex: 1300 }}>
        <List sx={{ bgcolor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', py: 0.5, minWidth: '150px' }}>
          {filteredUsers.map(user => {
            const displayName = user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
            return (
              <ListItem button key={user._id} onClick={() => handleSelectUser(user)} sx={{ '&:hover': { bgcolor: '#333' }, py: 1, px: 2 }}>
                <ListItemText primary={`@${displayName}`} primaryTypographyProps={{ sx: { color: '#fff', fontSize: '0.9rem', fontWeight: 'medium' } }} />
              </ListItem>
            );
          })}
        </List>
      </Popper>
    </Box>
  );
};

export default ChatInput;
