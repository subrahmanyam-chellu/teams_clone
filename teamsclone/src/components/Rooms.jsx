import React from 'react'
import { Box, Typography } from '@mui/material'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

const Rooms = () => {
  return (
    <Box sx={{width: '35%', height: '100vh', backgroundColor: '#2A2A2A', p: 2, display: 'flex', flexDirection: 'column', gap: 2, justifySelf: 'flex-start', alignItems: 'flex-start'}}>
        <Box sx={{backgroundColor: '#1A1A1A', p: 2, borderRadius: '10px'}}>
            <Typography variant='h4' sx={{fontWeight: 'bold', color: '#fff', mb: 2}}>conversations</Typography>
            <input type="text" placeholder='search' style={{width: '100%', padding: '10px', borderRadius: '5px', border: 'none'}} />
            <MoreVertRoundedIcon sx={{color: '#fff', mt: 2, cursor: 'pointer'}} />
        </Box>
    </Box>
  )
}

export default Rooms
