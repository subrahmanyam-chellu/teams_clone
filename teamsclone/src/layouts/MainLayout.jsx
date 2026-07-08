import React, { Children } from 'react'
import ResponsiveAppBar from '../components/ResponsiveAppBar'
import VerticalAppBar from '../components/VerticalAppBar'
import { Box } from '@mui/material'
import Rooms from '../components/Rooms'
import TeamsLayout from '../components/TeamsLayout'

const MainLayout = ({children}) => {
  return (
     <Box sx={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'auto', backgroundColor: '#1A1A1A' }}>
      <Box sx={{ width: 48, flexShrink: 0 }}>
        <VerticalAppBar />
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ height: 48, flexShrink: 0 }}>
          <ResponsiveAppBar />
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', position:'static', maxHeight:'100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout
