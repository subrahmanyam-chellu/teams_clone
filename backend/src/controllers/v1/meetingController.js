const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const meetingServices = require("../../services/v1/meetingServices");

const scheduleMeeting = async (req, res, next) => {
    try {
        const result = await meetingServices.scheduleMeeting(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(error.statusCode || statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const getMyMeetings = async (req, res, next) => {
    try {
        const result = await meetingServices.getMyMeetings(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(error.statusCode || statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const cancelMeeting = async (req, res, next) => {
    try {
        const result = await meetingServices.cancelMeeting(req);
        return { statusCode: result.statusCode, data: result.data, message: result.message };
    } catch (error) {
        return new ErrorHandler(error.statusCode || statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

module.exports = {
    scheduleMeeting,
    getMyMeetings,
    cancelMeeting
};
