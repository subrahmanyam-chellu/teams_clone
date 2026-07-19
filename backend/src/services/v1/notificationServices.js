const Notifications = require("../../models/Notifications");
const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");

const getNotifications = async (req) => {
    try {
        const userId = req.user.id;
        const notifications = await Notifications.find({ userId })
            .populate({
                path: "messageId",
                populate: {
                    path: "sender",
                    select: "firstName lastName email profilePicture"
                }
            })
            .populate("roomId", "roomName roomType roomProfile")
            .sort({ createdAt: -1 });

        return { statusCode: statusCodes.OK, data: notifications, message: "Notifications fetched successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const markAllAsRead = async (req) => {
    try {
        const userId = req.user.id;
        await Notifications.updateMany({ userId, status: "unread" }, { $set: { status: "read" } });
        return { statusCode: statusCodes.OK, data: null, message: "All notifications marked as read" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const markAsRead = async (req) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const notification = await Notifications.findOneAndUpdate(
            { _id: id, userId },
            { $set: { status: "read" } },
            { new: true }
        );
        if (!notification) {
            return new ErrorHandler(statusCodes.NOT_FOUND, "Notification not found or unauthorized");
        }
        return { statusCode: statusCodes.OK, data: notification, message: "Notification marked as read" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const clearAllNotifications = async (req) => {
    try {
        const userId = req.user.id;
        await Notifications.deleteMany({ userId });
        return { statusCode: statusCodes.OK, data: null, message: "All notifications cleared successfully" };
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
