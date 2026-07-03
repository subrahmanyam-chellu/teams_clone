const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const Rooms = require("../../models/Rooms");
const cloudinary = require("../../config/cloudinary");
const upload = require("../../middlewares/upload");

//creation of room
const createRoom = async (data) => {
    try {
        const newRoom = new Rooms(data);
        const result = await newRoom.save();
        if (result)
            return { statusCode: statusCodes.CREATED, message: `${data.roomName} created successfully` };
        else
            return { statusCode: statusCodes.CREATED, message: `${data.roomName} created successfully` };

    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

//deletion of room
const deleteRoom = async (data) => {
    try {
        if (data.user.role === "ADMIN") {
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

        if (data.user.role === "ADMIN") {
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

        if (req.user.role === "ADMIN") {

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

        if (data.user.role === "ADMIN") {
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

        if (data.user.role === "ADMIN") {
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

module.exports = { createRoom, deleteRoom, updateRoomName, updateRoomProfile, addMembers, deleteMembers };