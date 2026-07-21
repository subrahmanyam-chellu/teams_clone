const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const Rooms = require("../../models/Rooms");
const cloudinary = require("../../config/cloudinary");
const upload = require("../../middlewares/upload");
const crypto = require("crypto");

//creation of room
const createRoom = async (data) => {
    try {
        // For private rooms, check if a room already exists between the same two members
        if (data.roomType === 'private' && data.members && data.members.length === 2) {
            const existingRoom = await Rooms.findOne({
                roomType: 'private',
                members: { $all: data.members, $size: 2 }
            })
            .populate("members", "firstName lastName email profilePicture")
            .populate("lastMessage");

            if (existingRoom) {
                return { statusCode: statusCodes.OK, data: existingRoom, message: "Room already exists" };
            }
        }

        const newRoom = new Rooms(data);
        if (data.roomType === 'group') {
            newRoom.inviteCode = crypto.randomBytes(16).toString('hex');
        }
        const result = await newRoom.save();

        // Populate the newly created room before returning
        const populatedRoom = await Rooms.findById(result._id)
            .populate("members", "firstName lastName email profilePicture")
            .populate("lastMessage");

        return { statusCode: statusCodes.CREATED, data: populatedRoom, message: `${data.roomName} created successfully` };

    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//deletion of room
const deleteRoom = async (data) => {
    try {
        if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
            const result = await Rooms.findByIdAndDelete(data.params.id);
            console.log(result);
            return { statusCode: statusCodes.OK, message: `deleted successfully` };
        }
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//updation of room
const updateRoomName = async (data) => {
    try {
        const { id } = data.params;
        const room = await Rooms.findById(id);

        if (!room) {
            return { statusCode: statusCodes.NOT_FOUND, message: "Room not found" };
        }

        if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
            const updatedRoom = await Rooms.findByIdAndUpdate(
                id,
                { roomName: data.body.roomName },
                { returnDocument: "after" }
            );

            return { statusCode: statusCodes.OK, data: updatedRoom, message: "room name updated successfully" };
        }

        return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//updation of room
const updateRoomProfile = async (req) => {
    try {
        const { id } = req.params;
        const room = await Rooms.findById(id);

        if (!room) {
            return { statusCode: statusCodes.NOT_FOUND, message: "Room not found" };
        }

        if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN") {

            if (!req.file) {
                return { statusCode: statusCodes.BAD_REQUEST, message: "No file uploaded" };
            }
            const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

            const result = await cloudinary.uploader.upload(fileStr, {
                folder: "teamsclone_profile_pics",
                public_id: `room_${id}`,
            });

            if (!result || !result.secure_url) {
                return { statusCode: statusCodes.INTERNAL_SERVER_ERROR, message: "Failed to upload image to Cloudinary" };
            }

            const updatedRoom = await Rooms.findByIdAndUpdate(
                id,
                { roomProfile: result.secure_url },
                { returnDocument: "after" }
            );

            return { statusCode: statusCodes.OK, data: updatedRoom, message: "room profile picture updated successfully" };
        }

        return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//adding members to room
const addMembers = async (data) => {
    try {
        const { id } = data.params;
        const room = await Rooms.findById(id);

        if (!room) {
            return { statusCode: statusCodes.NOT_FOUND, message: "Room not found" };
        }

        if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
            const updatedRoom = await Rooms.findByIdAndUpdate(
                id,
                [
                    {
                        $set: {
                            members: {
                                $setUnion: ["$members", data.body.members]
                            }
                        }
                    }
                ],
                {
                    returnDocument: 'after',
                    updatePipeline: true
                }
            );

            return { statusCode: statusCodes.OK, data: updatedRoom, message: "members added successfully" };
        }

        return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//deleting members to room
const deleteMembers = async (data) => {
    try {
        const { id } = data.params;
        const room = await Rooms.findById(id);

        if (!room) {
            return { statusCode: statusCodes.NOT_FOUND, message: "Room not found" };
        }

        if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
            const updatedRoom = await Rooms.findByIdAndUpdate(
                id,
                [
                    {
                        $set: {
                            members: {
                                $setDifference: ["$members", data.body.members]
                            }
                        }
                    }
                ],
                {
                    returnDocument: 'after',
                    updatePipeline: true
                }
            );

            return { statusCode: statusCodes.OK, data: updatedRoom, message: "members deleted successfully" };
        }

        return { statusCode: statusCodes.FORBIDDEN, message: "Not authorized" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const getMyRooms = async (req) => {
    try {
        const userId = req.user.id;
        const query = req.user.role === 'SUPER_ADMIN'
            ? { $or: [{ members: userId }, { roomType: 'group' }] }
            : { members: userId };

        const rooms = await Rooms.find(query)
            .populate("members", "firstName lastName email profilePicture")
            .populate("lastMessage");

        const Messages = require("../../models/Messages");
        const roomsWithUnread = await Promise.all(rooms.map(async (room) => {
            const unreadCount = await Messages.countDocuments({
                roomId: room._id,
                sender: { $ne: userId },
                deleted: { $ne: true },
                "readReceipts.userId": { $ne: userId }
            });
            return {
                ...room.toObject(),
                unreadCount
            };
        }));

        return { statusCode: statusCodes.OK, data: roomsWithUnread, message: "Rooms fetched successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//getting invite code for a room
const getInviteCode = async (data) => {
    try {
        const room = await Rooms.findById(data.params.id);
        if (!room) return new ErrorHandler(statusCodes.NOT_FOUND, "Room not found");
        if (room.roomType !== 'group') return new ErrorHandler(statusCodes.BAD_REQUEST, "Invite links are only for group rooms");

        if (!room.inviteCode) {
            room.inviteCode = crypto.randomBytes(16).toString('hex');
            await room.save();
        }

        return { statusCode: statusCodes.OK, data: { inviteCode: room.inviteCode }, message: "Invite code fetched successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//joining room by invite code
const joinByInviteCode = async (data) => {
    try {
        const room = await Rooms.findOne({ inviteCode: data.params.inviteCode });
        if (!room) return new ErrorHandler(statusCodes.NOT_FOUND, "Invalid invite link");

        const userId = data.user.id;
        const isMember = room.members.some(m => m.toString() === userId);
        if (isMember) {
            return { statusCode: statusCodes.OK, data: room, message: "You are already a member of this group" };
        }

        room.members.push(userId);
        await room.save();

        const populatedRoom = await Rooms.findById(room._id)
            .populate("members", "firstName lastName email profilePicture")
            .populate("lastMessage");

        return { statusCode: statusCodes.OK, data: populatedRoom, message: "Successfully joined the group" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

module.exports = { createRoom, deleteRoom, updateRoomName, updateRoomProfile, addMembers, deleteMembers, getMyRooms, getInviteCode, joinByInviteCode };