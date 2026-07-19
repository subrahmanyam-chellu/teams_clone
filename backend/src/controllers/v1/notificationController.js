const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const notificationServices = require("../../services/v1/notificationServices");

const getNotifications = async (req, res, next) => {
    try {
        const result = await notificationServices.getNotifications(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationServices.markAllAsRead(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const result = await notificationServices.markAsRead(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const clearAllNotifications = async (req, res, next) => {
    try {
        const result = await notificationServices.clearAllNotifications(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

module.exports = {
    getNotifications,
    markAllAsRead,
    markAsRead,
    clearAllNotifications
};
