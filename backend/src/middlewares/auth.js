const jwt = require("jsonwebtoken");
const ErrorHandler = require("../helper/ErrorHandler");
const { statusCodes } = require("../helper/statusCodes");

const auth = (req, res, next) => {
  try {

    if(!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      throw new ErrorHandler(statusCodes.UNAUTHORIZED, "No token provided");
      return {statusCode: statusCodes.UNAUTHORIZED, message: "No token provided"};
    }
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(err);
  }
};

//socket authentication
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user info to socket
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};

module.exports = {auth, socketAuth};
