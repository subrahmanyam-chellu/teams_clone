import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CircularIndeterminate from '/src/components/CircularIndeterminate';

const Forms = ({ isLogin, setIsLogin, isRegister, setIsRegister }) => {

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNo, setPhoneNo] = useState('');
    const [password, setPassword] = useState('');
    const [repassword, setRepassword] = useState('');
    const [error, setError] = useState('');
    const [errorL, setErrorL] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('MEMBER');
    const navigate = useNavigate();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const toggleLogin = () => {
        setIsLogin(true);
        setIsRegister(false);
    }

    const toggleRegister = () => {
        setIsLogin(false);
        setIsRegister(true);
    }

    const validate = () => {
        if (firstName.length < 3) {
            setError("First name must contain atleast 3 characters");
        }
        else if (lastName.length < 3) {
            setError("Last name must contain atleast 3 characters");
        }
        else if (phoneNo.length < 10) {
            setError("mobile number must contain 10 characters");
        }
        else if (!password.match(passwordRegex)) {
            setError("Password must contain atleast 8 characters, 1-UpperCase, LowerCase, Numerical, Symbol");
        }
        else if (password != repassword) {
            setError("both password should be same");
        }
        else if(password == repassword){
            setError("");
        }
    }

    const handleRegister = async (e) => {
          e.preventDefault();
          setLoading(true);
         try {
             const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/signup`, { firstName, lastName, phoneNo, email, password , role});
             if (response.status === 201) {
                 alert("Registered successfully.");
                 setLoading(false);
                 navigate('/auth');
             }
         } catch (err) {
             setError(`Registration failed error: ${err.message}`);
             setLoading(false);
         }
     };

    const handleLogin = async (e) => {
          e.preventDefault();
          setLoading(true);
         try {
             const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/login`, { email, password });
             console.log("login response", response);
             if (response.status === 200) {
                 localStorage.setItem("x-token", response.data.data.token);
                 localStorage.setItem("user", JSON.stringify(response.data.data.user));
                 setLoading(false);
                 const params = new URLSearchParams(window.location.search);
                 const redirect = params.get('redirect');
                 navigate(redirect || '/chat');
             }
         } catch (err) {
             setErrorL(`Login failed. ${err.message}`);
             setLoading(false);
         }
     };

    useEffect(() => { validate(); }, [firstName, lastName, phoneNo, email, password, repassword]);

    return (
        <>
        {loading &&<CircularIndeterminate texts='Loading...'/>}
        <Box sx={{ justifySelf: 'center', border: '1px solid #444', bgcolor: '#151515', borderRadius: '15px', p: 3, width: '400px', justifyContent: 'center', '&:hover':{boxShadow: '0 0 20px rgba(163, 249, 109, 0.25)', transform: 'translateY(-3px)', transition: 'all 0.3s ease'} }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, p: 0.5, border: '1px solid #333', borderRadius: '12px', bgcolor: '#1E1E1E' }}>
                <Button
                    variant={isRegister ? "contained" : "outlined"}
                    onClick={()=>{toggleRegister(); validate();}}
                    sx={{
                        flex: 1,
                        border: '0px',
                        color: isRegister ? '#000' : '#fff',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        background: isRegister
                            ? "linear-gradient(to right, #1c34bb, #a3f96d)"
                            : "none", borderRadius: '8px',
                        '&:hover': { border: '0px' }
                    }}
                >
                    Register
                </Button>
                <Button
                    variant={isLogin ? "contained" : "outlined"}
                    onClick={() => { toggleLogin(); setError("") }}
                    sx={{
                        flex: 1,
                        border: '0px',
                        color: isLogin ? '#000' : '#fff',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        background: isLogin
                            ? "linear-gradient(to right, #1c34bb, #a3f96d)"
                            : "none", borderRadius: '8px',
                        '&:hover': { border: '0px' }
                    }}
                >
                    Login
                </Button>
            </Box>


            {/* Forms */}
            {isRegister && (
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 3, borderRadius: '15px', backgroundColor: '#1E1E1E', border: '1px solid #333', p: 3 }}>
                    <TextField
                        fullWidth
                        label="First Name"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value) }}
                        required
                        sx={{
                            mb: 2,
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
                        label="Last Name"
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value) }}
                        required
                        sx={{
                            mb: 2,
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
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value) }}
                        required
                        sx={{
                            mb: 2,
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
                        label="Phone Number"
                        type="text"
                        value={phoneNo}
                        onChange={(e) => { setPhoneNo(e.target.value) }}
                        required
                        sx={{
                            mb: 2,
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
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value) }}
                        required
                        sx={{
                            mb: 2,
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
                        label="Re-enter Password"
                        type="password"
                        value={repassword}
                        onChange={(e) => { setRepassword(e.target.value) }}
                        required
                        sx={{
                            mb: 3,
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
                    {
                        error &&
                        <Typography color='error' sx={{ textAlign: 'center', textTransform: 'none', my: '8px' }}>{error}</Typography>
                    }
                    <Button 
                        type="submit" 
                        fullWidth 
                        variant="contained" 
                        sx={{ 
                            textTransform: 'none', 
                            fontSize: 18, 
                            fontWeight: 'bold', 
                            borderRadius: '10px',
                            bgcolor: '#a3f96d',
                            color: '#000',
                            '&:hover': { bgcolor: '#8ee05c' }
                        }}
                    >
                        Register
                    </Button>
                </Box>
            )}

            {isLogin && (
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 3, borderRadius: '15px', backgroundColor: '#1E1E1E', border: '1px solid #333', p: 3 }}>
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value) }}
                        required
                        sx={{
                            mb: 2,
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
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value) }}
                        required
                        sx={{
                            mb: 3,
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
                    {
                        errorL &&
                        <Typography color='error' sx={{textAlign:'center', textTransform:'none', my:'8px'}}>{errorL}</Typography>
                    } 
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button type="button" variant="text" sx={{ textTransform: 'none', fontSize: 12, fontWeight: 'bold', color: '#aaa', '&:hover': { color: '#a3f96d' } }}>Forgot Password</Button>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            sx={{ 
                                textTransform: 'none', 
                                fontSize: 18, 
                                fontWeight: 'bold', 
                                borderRadius: '10px',
                                bgcolor: '#a3f96d',
                                color: '#000',
                                '&:hover': { bgcolor: '#8ee05c' },
                                px: 3
                            }}
                        >
                            Login
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
        </>
    )
}

export default Forms
