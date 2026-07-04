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
                setLoading(false);
                if(response.data.data.user.role.toLowerCase()==='admin'){
                    navigate('/admin');
                }else{
                    navigate('/user');
                }
                
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
        <Box sx={{ justifySelf: 'center', border: '2px solid cyan', borderRadius: '15px', p: 2, justifyContent: 'center', '&:hover':{boxShadow: '3px 3px 5px 2px #7db8c2',transform: 'translateY(-5px)'} }}>
            <Box sx={{ width: '95%', display: 'flex', justifyContent: 'space-between', my: 3, p: 1, border: '2px solid cyan', borderRadius: '15px' }}>
                <Button
                    variant={isRegister ? "contained" : "outlined"}
                    onClick={()=>{toggleRegister(); validate();}}
                    sx={{
                        flex: 1,
                        border: '0px',
                        background: isRegister
                            ? "linear-gradient(to right, rgba(230, 0, 255, 0.899), rgba(0, 221, 255, 0.765))"
                            : "none", borderRadius: '10px'
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
                        background: isLogin
                            ? "linear-gradient(to right, rgba(230, 0, 255, 0.899), rgba(0, 221, 255, 0.765))"
                            : "none", borderRadius: '10px'
                    }}
                >
                    Login
                </Button>
            </Box>


            {/* Forms */}
            {isRegister && (
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 3, borderRadius: '15px', backgroundColor: '#9e9e4d', p: 2 }}>
                    <TextField
                        fullWidth
                        label="firstName"
                        name="First Name"
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value) }}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="lastName"
                        name="Last Name"
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value) }}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value) }}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="phoneNo"
                        name="phoneNo"
                        type="text"
                        value={phoneNo}
                        onChange={(e) => { setPhoneNo(e.target.value) }}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value) }}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Re-enter Password"
                        name="repassword"
                        type="password"
                        value={repassword}
                        onChange={(e) => { setRepassword(e.target.value) }}
                        required
                        sx={{ mb: 3 }}
                    />
                    {
                        error &&
                        <Typography color='error' sx={{ textAlign: 'center', textTransform: 'none', my: '8px' }}>{error}</Typography>
                    }
                    <Button type="submit" fullWidth variant="contained" color='success' sx={{ textTransform: 'none', fontSize: 18, fontWeight: 500, borderRadius: '10px' }}>Register</Button>
                </Box>
            )}

            {isLogin && (
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 3, borderRadius: '15px', backgroundColor: '#d3cfcfde', p: 2 }}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value) }}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value) }}
                        required
                        sx={{ mb: 3 }}
                    />
                    {
                        error&&
                        <Typography color='error' sx={{textAlign:'center', textTransform:'none', my:'8px'}}>{errorL}</Typography>
                    } 
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button type="button" variant="text" sx={{ textTransform: 'none', fontSize: 12, fontWeight: 500 }}>Forgot Password</Button>
                        <Button type="submit" variant="contained" color='success' sx={{ textTransform: 'none', fontSize: 18, fontWeight: 500, borderRadius: '10px' }}>Login</Button>
                    </Box>
                </Box>
            )}
        </Box>
        </>
    )
}

export default Forms
