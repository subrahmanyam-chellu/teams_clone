const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const db = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const { socketAuth } = require("./middlewares/auth");
const userRoutes = require("./routes/v1/userRoutes");
const roomRoutes = require("./routes/v1/roomRoutes");
const messageRoutes = require("./routes/v1/messageRoutes");
const Messages = require("./models/Messages");
const User = require("./models/User");
const ErrorHandler = require("./helper/ErrorHandler");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

//socket authentication middleware
io.use(socketAuth);

// Socket.IO events
io.on("connection", async (socket) => {
  console.log("New client connected:", socket.id);
  try {
    const userId = socket.user._id;
    await User.findByIdAndUpdate(userId, { isOnline: true });
  } catch (error) {
    console.log(error.message);
    return new ErrorHandler({ statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: error.message });
  };

  // Join a room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.rooms.forEach((roomId) => {
      socket.to(roomId).emit("userOnline", {
        userId
      });
    });
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Send a message
  socket.on("sendMessage", async (messageData) => {
    try {
      const newMessage = await Message.create(messageData);

      io.to(messageData.roomId).emit("receiveMessage", newMessage);
    } catch (err) {
      console.error("Error saving message:", err);
      socket.emit("errorMessage", { error: "Message could not be saved" });
      return new ErrorHandler({ statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: err.message });
    }
  });

  // Delivery receipt
  socket.on("delivered", async (data) => {
    try {
      await Message.findByIdAndUpdate(data.messageId, {
        $push: {
          deliveryReceipts: {
            userId: data.userId,
            isDelivered: true,
            deliveredAt: new Date()
          }
        }
      });

      io.to(data.roomId).emit("messageDelivered", data);
    } catch (err) {
      console.error("Error updating delivery receipt:", err);
      return new ErrorHandler({ statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: err.message });
    }
  });

  // Read receipt
  socket.on("read", async (data) => {
    try {
      await Message.findByIdAndUpdate(data.messageId, {
        $push: {
          readReceipts: {
            userId: data.userId,
            isRead: true,
            readAt: new Date()
          }
        }
      });

      io.to(data.roomId).emit("messageRead", data);
    } catch (err) {
      console.error("Error updating read receipt:", err);
      return new ErrorHandler({ statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: err.message });
    }
  });

  // Typing indicator
  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("userTyping", { userId: socket.id });
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    try {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastActive: new Date() });
      socket.rooms.forEach((roomId) => {
        socket.to(roomId).emit("userOffline", {
          userId,
          lastSeen: updatedUser.lastActive
        });
      });

    } catch (error) {
      return new ErrorHandler({ statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: error.message });
    }

  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

db();
