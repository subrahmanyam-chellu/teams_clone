// middleware/dispatcher.js
const { ErrorHandler } = require("../helper/ErrorHandler");
const { statusCodes } = require("../helper/statusCodes");
const { hasPermission } = require("../utils/permissions");

async function dispatcher(req, res, next, controllerFn, RESOURCE = null, PERM = null) {
  try {

    if (RESOURCE && PERM) {
      if (!hasPermission(req.user, RESOURCE, PERM)) {
        throw new ErrorHandler(statusCodes.FORBIDDEN, "Permission denied");
      }
    }

    const {statusCode, data, message} = await controllerFn(req, res, next);

    const status = statusCode || statusCodes.OK;
    const success = status >= 200 && status < 300;
    
    return res.status(status).json({ success, data, message });
  } catch (err) {
    next(err);
  }
}

module.exports = dispatcher;
