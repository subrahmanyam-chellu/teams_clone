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
