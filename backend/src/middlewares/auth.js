const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorHandler = require("../helper/ErrorHandler");
const { statusCodes } = require("../helper/statusCodes");

const auth = async (req, res, next) => {
  try {
    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      throw new ErrorHandler(statusCodes.UNAUTHORIZED, "No token provided");
    }
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ErrorHandler(statusCodes.UNAUTHORIZED, "User not found");
    }
    if (user.isBlocked) {
      throw new ErrorHandler(statusCodes.FORBIDDEN, "Your account has been blocked by the administrator.");
    }

    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

//socket authentication
const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error("User not found"));
    if (user.isBlocked) return next(new Error("Account blocked"));

    socket.user = { id: decoded.id, role: user.role }; // attach user info to socket
    socket.data.user = { id: decoded.id, role: user.role }; // attach to data for fetchSockets serialization
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};

module.exports = {auth, socketAuth};
