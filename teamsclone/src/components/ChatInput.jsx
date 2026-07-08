import React, { useState } from 'react';
import { Box, TextField, IconButton, Popper, List, ListItem, ListItemText } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const ChatInput = ({ onSend, users }) => {
  const [text, setText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Detect @mention
    const match = value.match(/@(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const results = users.filter(u => u.username.toLowerCase().startsWith(query));
      setFilteredUsers(results);
      setAnchorEl(e.currentTarget);
    } else {
      setFilteredUsers([]);
      setAnchorEl(null);
    }
  };

  const handleSelectUser = (user) => {
    // Replace @query with full username
    const newText = text.replace(/@\w*$/, `@${user.username} `);
    setText(newText);
    setFilteredUsers([]);
    setAnchorEl(null);
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend({ text, attachments: [] });
      setText('');
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', backgroundColor: '#222' }}>
      <IconButton sx={{ color: '#fff' }}>
        <AttachFileIcon />
      </IconButton>
      <TextField
        value={text}
        onChange={handleChange}
        placeholder="Type a message"
        variant="outlined"
        fullWidth
        size="small"
        sx={{
          input: { color: '#fff' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: '#555' },
            '&:hover fieldset': { borderColor: '#888' },
            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
          },
        }}
      />
      <IconButton sx={{ ml: 1, color: '#fff' }} onClick={handleSend}>
        <SendIcon />
      </IconButton>

      {/* Mentions dropdown */}
      <Popper open={filteredUsers.length > 0} anchorEl={anchorEl} placement="top-start">
        <List sx={{ bgcolor: '#333', color: '#fff', borderRadius: 1 }}>
          {filteredUsers.map(user => (
            <ListItem button key={user._id} onClick={() => handleSelectUser(user)}>
              <ListItemText primary={`@${user.username}`} />
            </ListItem>
          ))}
        </List>
      </Popper>
    </Box>
  );
};

export default ChatInput;
