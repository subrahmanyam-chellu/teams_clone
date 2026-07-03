const { statusCodes } = require("../helper/statusCodes");

function errorHandler(err, req, res, next) {
  const status = err.statusCode || statusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
