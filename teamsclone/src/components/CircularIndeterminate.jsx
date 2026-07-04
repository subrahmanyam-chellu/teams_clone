import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function CircularIndeterminate({texts}) {
  return (
    <Box sx={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 10, backgroundColor: '#ffffff00'
    }}>
      <Box sx={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
        <CircularProgress sx={{flexGrow:1}}/>
        <Typography variant='h5' color="error" sx={{textAlign:'center', width:'100%'}}>{texts}</Typography>
      </Box>
    </Box>
  );
}
