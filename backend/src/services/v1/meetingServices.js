const Meetings = require("../../models/Meetings");
const Rooms = require("../../models/Rooms");
const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");

const scheduleMeeting = async (req) => {
    const { title, description, startTime, endTime, roomId } = req.body;
    const userId = req.user.id;

    if (!title || !startTime || !endTime || !roomId) {
        throw new ErrorHandler({
            statusCode: statusCodes.BAD_REQUEST,
            message: "Missing required fields: title, startTime, endTime, roomId"
        });
    }

    const room = await Rooms.findById(roomId);
    if (!room) {
        throw new ErrorHandler({
            statusCode: statusCodes.NOT_FOUND,
            message: "Room not found"
        });
    }

    // Verify membership
    const mIds = room.members.map(id => id.toString());
    if (!mIds.includes(userId.toString())) {
        throw new ErrorHandler({
            statusCode: statusCodes.FORBIDDEN,
            message: "You are not a member of this room"
        });
    }

    const meeting = await Meetings.create({
        title,
        description,
        startTime,
        endTime,
        roomId,
        hostId: userId
    });

    return {
        statusCode: statusCodes.CREATED,
        data: meeting,
        message: "Meeting scheduled successfully"
    };
};

const getMyMeetings = async (req) => {
    const userId = req.user.id;

    // Auto-delete meetings that ended more than 1 minute ago
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    await Meetings.deleteMany({ endTime: { $lt: oneMinuteAgo } });

    // Find all rooms where the user is a member
    const myRooms = await Rooms.find({ members: userId });
    const roomIds = myRooms.map(r => r._id);

    const meetings = await Meetings.find({ roomId: { $in: roomIds } })
        .populate("roomId", "roomName roomType roomProfile")
        .populate("hostId", "firstName lastName username email")
        .sort({ startTime: 1 });

    return {
        statusCode: statusCodes.OK,
        data: meetings,
        message: "Meetings retrieved successfully"
    };
};

const cancelMeeting = async (req) => {
    const meetingId = req.params.id;
    const userId = req.user.id;

    const meeting = await Meetings.findById(meetingId);
    if (!meeting) {
        throw new ErrorHandler({
            statusCode: statusCodes.NOT_FOUND,
            message: "Meeting not found"
        });
    }

    // Verify host or admin status
    const room = await Rooms.findById(meeting.roomId);
    const isAdmin = req.user.role === "ADMIN";
    const isHost = meeting.hostId.toString() === userId.toString();

    if (!isHost && !isAdmin) {
        throw new ErrorHandler({
            statusCode: statusCodes.FORBIDDEN,
            message: "You do not have permission to cancel this meeting"
        });
    }

    await Meetings.findByIdAndDelete(meetingId);

    return {
        statusCode: statusCodes.OK,
        data: null,
        message: "Meeting cancelled successfully"
    };
};

module.exports = {
    scheduleMeeting,
    getMyMeetings,
    cancelMeeting
};
