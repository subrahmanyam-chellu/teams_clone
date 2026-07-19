import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/homepage/HomePage'
import Auth from './pages/authpage/Auth'
import ChatPage from './pages/chatpage/ChatPage'
import TeamsPage from './pages/teamspage/TeamsPage'
import NotificationsPage from './pages/notificationspage/NotificationsPage'
import JoinRoom from './pages/joinroom/JoinRoom'
import ResponsiveAppBar from './components/ResponsiveAppBar'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/join/:inviteCode" element={<JoinRoom />} />
      </Routes>
    </Router>
    // <ResponsiveAppBar />
  )
}

export default App
