const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");
const Messages = require("../../models/Messages");
const cloudinary = require("../../config/cloudinary");
const Rooms = require("../../models/Rooms");

//sending message
const sendMessage = async (data) => {
    try {
        const room = await Rooms.findById(data.body.roomId);
        if (data.user.id !== data.body.sender)
            return new ErrorHandler(statusCodes.CONFLICT, "sender and sender id is not same");
        if (!room)
            return new ErrorHandler(statusCodes.NOT_FOUND, "room is not found");

        if (!data.body.parentMessageId || data.body.parentMessageId === "" || data.body.parentMessageId === "null" || data.body.parentMessageId === "undefined") {
            delete data.body.parentMessageId;
        }
        // if (data.body.files) {

        //     const fileStr = `data:${data.file.mimetype};base64,${data.body.file.buffer.toString("base64")}`;

        //     let resourceType = "raw";
        //     if (data.file.mimetype.startsWith("image/")) {
        //         resourceType = "image";
        //     } else if (data.body.file.mimetype.startsWith("video/")) {
        //         resourceType = "video";
        //     }

        //     const cloudFile = await cloudinary.uploader.upload(fileStr, {
        //         folder: "teamsclone_profile_pics",
        //         public_id: `message_${data.body.sender}_${Date.now()}`,
        //         resource_type: resourceType
        //     });
        //     data.body.mediaUrl = cloudFile.secure_url;

        // }
        let attachments = [];
        if (data.body.files && data.body.files.length > 0) {
            attachments = await Promise.all(
                data.body.files.map(async (file, index) => {
                    const fileStr = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

                    let resourceType = "raw";
                    if (file.mimetype.startsWith("image/")) resourceType = "image";
                    else if (file.mimetype.startsWith("video/")) resourceType = "video";

                    const cloudFile = await cloudinary.uploader.upload(fileStr, {
                        folder: "teamsclone_files",
                        public_id: `message_${data.body.sender}_${Date.now()}_${index}`,
                        resource_type: resourceType
                    });

                    return cloudFile.secure_url;
                    // type: file.mimetype,
                    // size: file.size,
                    // originalname: file.originalname
                })
            );
        }

        data.body.mediaUrl = attachments;
        const result = await Messages.create(data.body);
        if (result) {
            const lastMessage = await Rooms.findByIdAndUpdate(data.body.roomId, { $set: { lastMessage: result._id } });
            
            // Create notifications for offline room members
            const Notifications = require("../../models/Notifications");
            
            let offlineMembers = [];
            if (data.io) {
                const allSockets = await data.io.fetchSockets();
                const onlineUserIds = allSockets.map(s => s.data?.user?.id?.toString() || s.user?.id?.toString() || s.user?._id?.toString()).filter(Boolean);
                
                offlineMembers = room.members.filter(memberId => {
                    const mIdStr = memberId.toString();
                    return mIdStr !== data.body.sender.toString() && !onlineUserIds.includes(mIdStr);
                });
            }

            if (offlineMembers.length > 0) {
                const notifData = offlineMembers.map(memberId => ({
                    userId: memberId,
                    messageId: result._id,
                    roomId: room._id,
                    status: "unread"
                }));
                await Notifications.insertMany(notifData);
            }
        } else {
            return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, "error is related with database ");
        }
        return { statusCode: statusCodes.CREATED, data: result, message: "message created successfully" };

    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };

};

//editing message
const editMessage = async (data) => {
    try {
        const message = await Messages.findById(data.params.id);
        if (!message)
            return new ErrorHandler(statusCodes.NOT_FOUND, "message is not found");
        if (data.user.id === message.sender.toString() || data.user.role === "ADMIN") {
            const result = await Messages.findByIdAndUpdate(data.params.id, { $set: { content: data.body.content, edited: true } }, { returnDocument: "after" });
            return { statusCode: statusCodes.OK, data: result, message: "message updated successfully" };
        }
        else
            return new ErrorHandler(statusCodes.CONFLICT, "you are not authorized to edit this message");
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//delete message
const deleteMessage = async (data) => {
    try {
        const message = await Messages.findById(data.params.id);
        if (!message)
            return new ErrorHandler(statusCodes.NOT_FOUND, "message is not found");
        if (data.user.id === message.sender.toString() || data.user.role === "ADMIN") {
            const result = await Messages.findByIdAndUpdate(data.params.id, { $set: { deleted: true, content: "", mediaUrl: [] } }, { returnDocument: "after" });
            return { statusCode: statusCodes.OK, data: result, message: "message deleted successfully" };
        }
        else
            return new ErrorHandler(statusCodes.CONFLICT, "you are not authorized to edit this message");
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//reacting message
const reactMessage = async (data) => {
    try {
        const message = await Messages.findById(data.params.id);
        if (!message)
            return new ErrorHandler(statusCodes.NOT_FOUND, "message is not found");
        const result = await Messages.findByIdAndUpdate(data.params.id, { $push: { reactions: { userId: data.body.userId || data.body.sender, sender: data.body.sender || data.body.userId, emoji: data.body.emoji } } }, { returnDocument: "after" });
        return { statusCode: statusCodes.OK, data: result, message: "message updated successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//getting messages by roomId
const getMessagesByRoomId = async (data) => {
    try {
        const rooms = await Rooms.findById(data.params.roomId);
        if (!rooms)
            return new ErrorHandler(statusCodes.NOT_FOUND, "room is not found");
        else if (!rooms.members.some(m => m.toString() === data.user.id) && data.user.role !== "ADMIN") {
            return new ErrorHandler(statusCodes.FORBIDDEN, "you are not a member of this room");
        }
        const result = await Messages.find({ roomId: data.params.roomId })
            .populate("sender", "firstName lastName email profilePicture")
            .sort({ createdAt: -1 })
            .skip((data.body.page - 1) * data.body.limit)
            .limit(data.body.limit);
        const count = await Messages.countDocuments({roomId: data.params.roomId});
        return { statusCode: statusCodes.OK, data: {result, count}, message: "message fetched successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

//getting all messages 
const getAllMessages = async (data) => {
    try {
        if (data.user.role !== "ADMIN") {
            return new ErrorHandler(statusCodes.FORBIDDEN, "you are not authorized to access this route");
        }
        const result = await Messages.find().sort({ createdAt: -1 }).skip((data.body.page - 1) * data.body.limit).limit(data.body.limit);
        const count = await Messages.countDocuments();
        return { statusCode: statusCodes.OK, data: {result, count}, message: "message fetched successfully" };
    } catch (error) {
        return new ErrorHandler(statusCodes.INTERNAL_SERVER_ERROR, error.message);
    };
};

module.exports = { sendMessage, editMessage, deleteMessage, reactMessage, getMessagesByRoomId, getAllMessages };