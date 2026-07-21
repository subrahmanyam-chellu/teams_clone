import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import Groups3Icon from '@mui/icons-material/Groups3';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const pages = ['Products', 'Pricing', 'Blog'];
const settings = ['Profile', 'Account', 'Logout'];

function ResponsiveAppBar() {
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);

  // Account edit states
  const [accountOpen, setAccountOpen] = React.useState(false);
  const [accountLoading, setAccountLoading] = React.useState(false);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phoneNo, setPhoneNo] = React.useState('');

  React.useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem("user") || "null");
    setCurrentUser(userObj);

    const handleProfileUpdate = () => {
      const updated = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentUser(updated);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleSettingClick = (setting) => {
    handleCloseUserMenu();
    if (setting === 'Logout') {
      localStorage.removeItem("x-token");
      localStorage.removeItem("user");
      navigate('/auth');
    } else if (setting === 'Profile') {
      setProfileOpen(true);
    } else if (setting === 'Account') {
      if (currentUser) {
        setFirstName(currentUser.firstName || '');
        setLastName(currentUser.lastName || '');
        setEmail(currentUser.email || '');
        setPhoneNo(currentUser.phoneNo || '');
      }
      setAccountOpen(true);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNo.trim()) {
      alert("All fields are required.");
      return;
    }

    if (firstName.trim().length < 3) {
      alert("First Name must be at least 3 characters.");
      return;
    }
    if (lastName.trim().length < 3) {
      alert("Last Name must be at least 3 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNo.trim())) {
      alert("Phone Number must be exactly 10 digits.");
      return;
    }

    setAccountLoading(true);
    try {
      const token = localStorage.getItem("x-token");
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/update/details/${currentUser._id}`,
        { firstName, lastName, email, phoneNo },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        const updatedUser = response.data.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('profileUpdated'));
        alert("Account details updated successfully!");
        setAccountOpen(false);
      }
    } catch (error) {
      console.error("Failed to update account details:", error);
      alert(error.response?.data?.message || "Failed to update details.");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem("x-token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/update/profile-picture/${currentUser._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.status === 200) {
        const updatedUser = response.data.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('profileUpdated'));
        alert("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update profile picture:", error);
      alert(error.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          height:'48px', 
          justifyContent:'center', 
          background: 'linear-gradient(to right, rgba(28, 52, 187, 0.95), rgba(15, 18, 30, 0.98))',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          mb:'0px' 
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Groups3Icon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, height:'45px', width:'35px' }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              TEAMS
            </Typography>
            <Groups3Icon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, height:'35px', width:'35px' }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              TEAMS
            </Typography>
            {/* <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {page}
                </Button>
              ))}
            </Box> */}
            <Box sx={{ flexGrow: 0, display:'flex', justifyContent:'flex-end', width:'100%' }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar 
                    alt={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "User Profile"} 
                    src={currentUser?.profilePicture || ''}
                    sx={{ bgcolor: '#a3f96d', color: '#000', fontWeight: 'bold', fontSize: '0.9rem' }}
                  >
                    {currentUser ? `${currentUser.firstName[0]?.toUpperCase() || ''}${currentUser.lastName[0]?.toUpperCase() || ''}` : '?'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: '#1E1E1E',
                      color: '#fff',
                      border: '1px solid #333',
                      minWidth: '150px'
                    }
                  }
                }}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting} onClick={() => handleSettingClick(setting)} sx={{ '&:hover': { bgcolor: '#2A2A2A' } }}>
                    <Typography sx={{ textAlign: 'center', width: '100%', fontWeight: 'bold' }}>{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Profile Picture Only Dialog */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #444' } }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, bgcolor: '#1c34bb', color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Profile Picture</Typography>
          <IconButton size="small" onClick={() => setProfileOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, mt: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar 
              src={currentUser?.profilePicture || ''} 
              sx={{ width: 150, height: 150, bgcolor: '#a3f96d', color: '#000', fontSize: '3rem', fontWeight: 'bold' }}
            >
              {currentUser ? `${currentUser.firstName[0]?.toUpperCase() || ''}${currentUser.lastName[0]?.toUpperCase() || ''}` : '?'}
            </Avatar>
            {uploading && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={45} sx={{ color: '#a3f96d' }} />
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            component="label"
            disabled={uploading}
            sx={{
              textTransform: 'none',
              bgcolor: '#a3f96d',
              color: '#000',
              fontWeight: 'bold',
              '&:hover': { bgcolor: '#8ee05c' },
              '&.Mui-disabled': { bgcolor: '#555', color: '#888' },
              mt: 1
            }}
          >
            {uploading ? 'Uploading...' : 'Update Profile Picture'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
        </DialogContent>
      </Dialog>

      {/* Account Details Form Dialog */}
      <Dialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: { sx: { bgcolor: '#1A1A1A', color: '#fff', borderRadius: '15px', border: '1px solid #444', maxWidth: '420px' } }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2, bgcolor: '#1c34bb', color: '#fff' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Account Details</Typography>
          <IconButton size="small" onClick={() => setAccountOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3.5, pt: 3, pb: 3.5 }}>
          <form onSubmit={handleUpdateDetails} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '8px' }}>
            <TextField
              fullWidth
              required
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& input': { color: '#f0f0f0' },
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                },
                '& .MuiInputLabel-root': { color: '#aaa' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
              }}
            />
            <TextField
              fullWidth
              required
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& input': { color: '#f0f0f0' },
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                },
                '& .MuiInputLabel-root': { color: '#aaa' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
              }}
            />
            <TextField
              fullWidth
              required
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& input': { color: '#f0f0f0' },
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                },
                '& .MuiInputLabel-root': { color: '#aaa' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
              }}
            />
            <TextField
              fullWidth
              required
              label="Phone Number"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& input': { color: '#f0f0f0' },
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#a3f96d' },
                },
                '& .MuiInputLabel-root': { color: '#aaa' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#a3f96d' }
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={accountLoading}
              sx={{
                textTransform: 'none',
                bgcolor: '#a3f96d',
                color: '#000',
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#8ee05c' },
                '&.Mui-disabled': { bgcolor: '#555', color: '#888' },
                py: 1,
                mt: 1
              }}
            >
              {accountLoading ? 'Updating Details...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default ResponsiveAppBar;
