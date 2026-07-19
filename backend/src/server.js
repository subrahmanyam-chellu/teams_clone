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
const notificationRoutes = require("./routes/v1/notificationRoutes");
const Messages = require("./models/Messages");
const User = require("./models/User");
const Rooms = require("./models/Rooms");
const ErrorHandler = require("./helper/ErrorHandler");
const { statusCodes } = require("./helper/statusCodes");

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
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

//socket authentication middleware
io.use(socketAuth);

// Socket.IO events
io.on("connection", async (socket) => {
  console.log("New client connected:", socket.id);
  const userId = socket.user?.id;
  try {
    if (userId) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
    }
  } catch (error) {
    console.log(error.message);
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
      if (!messageData.parentMessageId || messageData.parentMessageId === "" || messageData.parentMessageId === "null" || messageData.parentMessageId === "undefined") {
        delete messageData.parentMessageId;
      }
      const newMessage = await Messages.create(messageData);
      
      // Update room lastMessage in DB so it persists on page refresh!
      await Rooms.findByIdAndUpdate(messageData.roomId, {
        $set: { lastMessage: newMessage._id }
      });

      // Create notifications for offline room members
      const room = await Rooms.findById(messageData.roomId);
      if (room) {
        const allSockets = await io.fetchSockets();
        const onlineUserIds = allSockets.map(s => s.data?.user?.id?.toString() || s.user?.id?.toString() || s.user?._id?.toString()).filter(Boolean);

        const offlineMembers = room.members.filter(memberId => {
          const mIdStr = memberId.toString();
          return mIdStr !== messageData.sender.toString() && !onlineUserIds.includes(mIdStr);
        });

        if (offlineMembers.length > 0) {
          const Notifications = require("./models/Notifications");
          const notifData = offlineMembers.map(memberId => ({
            userId: memberId,
            messageId: newMessage._id,
            roomId: room._id,
            status: "unread"
          }));
          await Notifications.insertMany(notifData);
        }
      }

      const populated = await newMessage.populate("sender", "firstName lastName email profilePicture");

      io.to(messageData.roomId).emit("receiveMessage", populated);
    } catch (err) {
      console.error("Error saving message:", err);
      socket.emit("errorMessage", { error: "Message could not be saved" });
      return new ErrorHandler({ statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: err.message });
    }
  });

  // Delivery receipt
  socket.on("delivered", async (data) => {
    try {
      await Messages.findByIdAndUpdate(data.messageId, {
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
      await Messages.findByIdAndUpdate(data.messageId, {
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

  // Reaction update relay
  socket.on("reaction", (data) => {
    io.to(data.roomId).emit("messageReaction", data);
  });

  // Typing indicator
  socket.on("typing", (data) => {
    if (typeof data === "string") {
      socket.to(data).emit("userTyping", { userId: socket.id });
    } else if (data && data.roomId) {
      socket.to(data.roomId).emit("userTyping", {
        roomId: data.roomId,
        userId: data.userId,
        username: data.username
      });
    }
  });

  socket.on("stopTyping", (data) => {
    if (data && data.roomId) {
      socket.to(data.roomId).emit("userStopTyping", {
        roomId: data.roomId,
        userId: data.userId
      });
    }
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    try {
      if (userId) {
        const lastActiveDate = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastActive: lastActiveDate });
        socket.rooms.forEach((roomId) => {
          socket.to(roomId).emit("userOffline", {
            userId,
            lastSeen: lastActiveDate
          });
        });
      }
    } catch (error) {
      console.error("Disconnect error:", error.message);
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

db().then(async () => {
  try {
    const rawDocs = await Messages.collection.find({ parentMessageId: { $exists: true, $ne: null } }).toArray();
    let cleanedCount = 0;
    for (const doc of rawDocs) {
      if (doc.parentMessageId && typeof doc.parentMessageId === 'string' && doc.parentMessageId.length !== 24) {
        await Messages.collection.updateOne({ _id: doc._id }, { $unset: { parentMessageId: "" } });
        cleanedCount++;
      }
    }
    console.log(`Database sanitized: cleaned up ${cleanedCount} invalid parentMessageId values using raw collection.`);
  } catch (err) {
    console.error("Database sanitization error:", err.message);
  }
});
