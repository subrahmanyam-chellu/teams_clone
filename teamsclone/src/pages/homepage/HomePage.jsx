import { Box, Button, Typography } from "@mui/material";
import React from "react";
import heroImage from "../../assets/glowrocket.jpeg";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
const HomePage = () => {

 const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh", // use minHeight instead of fixed height
        overflow: "hidden", // prevent extra scroll
      }}
    >
      {/* Left side - Image */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, md: 4 },
        }}
      >
        <Box
          component="img"
          src={heroImage}
          alt="hero image"
          className="slide"
          sx={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: 2,
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "center", md: "flex-start" },
          justifyContent: "center",
          textAlign: { xs: "center", md: "left" },
          gap: 2,
          p: { xs: 4, md: 8 },
        }}
      >
        <Typography
          variant="h3"
          sx={{ color: "whitesmoke", fontWeight: "bolder" }}
        >
          Welcome to Teams Clone
        </Typography>

        <Typography variant="h6" sx={{ color: "whitesmoke", fontWeight: "bold" }}>
          This is a simple clone of Microsoft Teams built with React and Vite.
        </Typography>

        <Typography variant="h6" sx={{ color: "whitesmoke", fontWeight: "bold" }}>
          Teams brings people together with real‑time chat for quick conversations
          and organized channels that keep projects on track. It’s a single space
          where collaboration, file sharing, and meetings flow seamlessly.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          sx={{
            mt: 2,
            background: "linear-gradient(10deg, #00BFFF, #054545, #00BFFF)",
            textTransform: "none",
            fontSize: "18px",
            px: 4,
            py: 1.5,
          }}
          onClick={() => navigate("/auth")}
        >
          Continue..
        </Button>
      </Box>
    </Box>
  );
};

export default HomePage;
