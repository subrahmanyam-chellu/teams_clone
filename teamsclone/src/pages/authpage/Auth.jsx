import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Forms from '../../components/Forms';
import './Auth.css';
import {jwtDecode} from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(false);
    const [isRegister, setIsRegister] = useState(true);
    const token = localStorage.getItem("x-token");
    const navigate = useNavigate();
    

    useEffect(()=>{
        const user = localStorage.getItem("user");
        if(token && user){
            const decode = jwtDecode(token);
            if(decode.exp * 1000 > Date.now()){
                navigate('/chat');
            }
        }
    },[]);

    return (
        <Box sx={{ p: 1, maxWidth: 800, mx: 'auto', mb:{xs:'15px', sm:'0px'}, height:'100%'}}>
            <Box mb={4}>
                {isRegister ? (
                    <>
                        <Typography sx={{ fontSize: { xs: 25, md:60 }, fontWeight: { xs: 600 }, textAlign: 'center' }}>
                            Join Our Platform
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 16, md:24 }, fontWeight: 500, textAlign: 'center', my: { xs: '15px' } }}>
                            Create your account to experience Teams clone
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography sx={{ fontSize: { xs: 25, md:60 }, fontWeight: { xs: 600 }, textAlign: 'center' }}>
                            Welcome Back
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 16, md:24 }, fontWeight: 500, textAlign: 'center', my: { xs: '15px' } }}>
                            Sign in to access your teams dashboard
                        </Typography>
                    </>
                )}
            </Box>
            <Box className='forms' sx={{width:{xs:'99%', md:'500px'}, justifySelf:'center', color:"white"}}>
                <Forms isLogin={isLogin} setIsLogin={setIsLogin} isRegister={isRegister} setIsRegister={setIsRegister}/>
            </Box>
        </Box>
    );
};

export default Auth;
