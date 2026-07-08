import React from 'react';
import { Box, Typography, TextField, IconButton, Divider } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import SendIcon from '@mui/icons-material/Send';

const TeamsLayout = () => {
  return (
    <Box sx={{ display: 'flex', height: '100%', backgroundColor: '#1A1A1A' }}>
      {/* Conversations list */}
      <Box sx={{ width: 300, backgroundColor: '#252525', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>Conversations</Typography>
          <MoreVertRoundedIcon sx={{ color: '#fff', cursor: 'pointer' }} />
        </Box>
        <TextField
          placeholder="Search"
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
        {/* Example conversation list */}
        <Box sx={{ mt: 2, color: '#ccc' }}>Alice</Box>
        <Box sx={{ mt: 1, color: '#ccc' }}>Bob</Box>
        <Box sx={{ mt: 1, color: '#ccc' }}>Charlie</Box>
      </Box>

      {/* Chat window */}
      <Box sx={{ flexGrow: 1, backgroundColor: '#1A1A1A', display: 'flex', flexDirection: 'column' }}>
        {/* Chat header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>Alice</Typography>
          <MoreVertRoundedIcon sx={{ color: '#fff', cursor: 'pointer' }} />
        </Box>

        {/* Messages area */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          <Typography sx={{ color: '#fff', mb: 1 }}>Alice: Hey, how’s the project?</Typography>
          <Typography sx={{ color: '#0f0', mb: 1 }}>You: Going well, just fixing bugs.</Typography>
        </Box>

        <Divider sx={{ borderColor: '#333' }} />

        {/* Input area */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
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
          <IconButton sx={{ ml: 1, color: '#fff' }}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default TeamsLayout;
