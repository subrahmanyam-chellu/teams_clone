const User = require("../../models/User");
const Rooms = require("../../models/Rooms");
const Messages = require("../../models/Messages");
const SystemConfig = require("../../models/SystemConfig");
const AdminJobs = require("../../models/AdminJobs");
const Notifications = require("../../models/Notifications");
const ErrorHandler = require("../../helper/ErrorHandler");
const { statusCodes } = require("../../helper/statusCodes");

// Helper to check if a system config exists, if not create default
const getOrCreateSystemConfig = async () => {
    let config = await SystemConfig.findOne();
    if (!config) {
        config = await SystemConfig.create({
            rateLimit: 100,
            fileUploadLimit: 20,
            enableCalling: true,
            enableRegistration: true,
            enableFileUpload: true
        });
    }
    return config;
};

// Helper to seed mock background jobs if not present
const seedJobsIfEmpty = async () => {
    // Delete any old jobs containing non-relevant services to clean up
    await AdminJobs.deleteMany({ name: { $regex: /LDAP|Backup|S3|Archive/i } });

    const count = await AdminJobs.countDocuments();
    if (count === 0) {
        await AdminJobs.insertMany([
            { name: "Purge Expired Meetings", status: "COMPLETED", lastRun: new Date(Date.now() - 3600 * 1000), nextRun: new Date(Date.now() + 3600 * 1000 * 2), runCount: 120 },
            { name: "Recalculate User Activity Metrics", status: "COMPLETED", lastRun: new Date(Date.now() - 3600 * 1000 * 3), nextRun: new Date(Date.now() + 3600 * 1000 * 12), runCount: 8 },
            { name: "Sync Offline Notifications", status: "COMPLETED", lastRun: new Date(Date.now() - 300 * 1000), nextRun: new Date(Date.now() + 300 * 1000), runCount: 450 }
        ]);
    }
};

const getUsers = async (req) => {
    const { q } = req.query;
    const filter = {};
    if (q && q.trim()) {
        const query = q.trim();
        filter.$or = [
            { firstName: { $regex: query, $options: "i" } },
            { lastName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } }
        ];
    }
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    return { statusCode: statusCodes.OK, data: users, message: "Users fetched successfully" };
};

const toggleBlockUser = async (req) => {
    const { id } = req.params;
    const { block } = req.body; // boolean

    const user = await User.findById(id);
    if (!user) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "User not found");
    }

    if (user.role === 'SUPER_ADMIN') {
        throw new ErrorHandler(statusCodes.BAD_REQUEST, "Cannot block a Super Admin");
    }

    user.isBlocked = block;
    await user.save();

    // If blocking user, disconnect their socket if they are online
    if (block && global.io) {
        const allSockets = await global.io.fetchSockets();
        for (const s of allSockets) {
            const socketUserId = s.data?.user?.id?.toString() || s.user?.id?.toString();
            if (socketUserId === id.toString()) {
                s.disconnect(true);
            }
        }
    }

    return { statusCode: statusCodes.OK, data: user, message: `User ${block ? 'blocked' : 'unblocked'} successfully` };
};

const deleteUser = async (req) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "User not found");
    }

    if (user.role === 'SUPER_ADMIN') {
        throw new ErrorHandler(statusCodes.BAD_REQUEST, "Cannot delete a Super Admin");
    }

    // Delete user from User collection
    await User.findByIdAndDelete(id);

    // Remove user from all rooms/groups
    await Rooms.updateMany(
        { members: id },
        { $pull: { members: id } }
    );

    return { statusCode: statusCodes.OK, message: "User deleted successfully" };
};

const getUserActivity = async (req) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "User not found");
    }

    // Gather activity statistics
    const messageCount = await Messages.countDocuments({ sender: id });
    const groupsJoined = await Rooms.countDocuments({ members: id, roomType: 'group' });
    const directChats = await Rooms.countDocuments({ members: id, roomType: 'private' });

    const recentMessages = await Messages.find({ sender: id })
        .populate("roomId", "roomName roomType")
        .sort({ createdAt: -1 })
        .limit(10);

    return {
        statusCode: statusCodes.OK,
        data: {
            user,
            stats: {
                messageCount,
                groupsJoined,
                directChats
            },
            recentMessages
        },
        message: "User activity fetched successfully"
    };
};

const getTeams = async () => {
    const teams = await Rooms.find({ roomType: "group" })
        .populate("members", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 });
    return { statusCode: statusCodes.OK, data: teams, message: "Teams fetched successfully" };
};

const deleteTeam = async (req) => {
    const { id } = req.params;
    const room = await Rooms.findById(id);
    if (!room) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "Group not found");
    }

    await Rooms.findByIdAndDelete(id);
    // Delete all messages in the room
    await Messages.deleteMany({ roomId: id });
    // Delete notifications associated with this room
    await Notifications.deleteMany({ roomId: id });

    return { statusCode: statusCodes.OK, message: "Group and its messages deleted successfully" };
};

const updateTeamMembers = async (req) => {
    const { id } = req.params;
    const { members } = req.body; // array of User IDs

    const room = await Rooms.findById(id);
    if (!room) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "Group not found");
    }

    room.members = members;
    await room.save();

    const populatedRoom = await room.populate("members", "firstName lastName email profilePicture");
    return { statusCode: statusCodes.OK, data: populatedRoom, message: "Group members updated successfully" };
};

const getChats = async () => {
    const chats = await Rooms.find()
        .populate("members", "firstName lastName email profilePicture role")
        .sort({ updatedAt: -1 });
    return { statusCode: statusCodes.OK, data: chats, message: "All chats fetched successfully" };
};

const deleteMessage = async (req) => {
    const { id } = req.params;
    const message = await Messages.findById(id);
    if (!message) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "Message not found");
    }

    // Set message as deleted (soft delete)
    await Messages.findByIdAndUpdate(id, { deleted: true, content: "This message was deleted by the moderator." });

    // Relay real-time deleted message socket event
    if (global.io) {
        global.io.to(message.roomId.toString()).emit("messageDeleted", { messageId: id, roomId: message.roomId });
    }

    return { statusCode: statusCodes.OK, message: "Message moderated/deleted successfully" };
};

const flagMessage = async (req) => {
    const { id } = req.params;
    const { flag, reason } = req.body; // flag: boolean, reason: string

    const message = await Messages.findById(id);
    if (!message) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "Message not found");
    }

    message.isFlagged = flag;
    message.flagReason = flag ? (reason || "Inappropriate content") : "";
    await message.save();

    return { statusCode: statusCodes.OK, data: message, message: `Message ${flag ? 'flagged' : 'unflagged'} successfully` };
};

const getActiveCalls = async () => {
    const calls = [];
    if (global.activeCalls) {
        global.activeCalls.forEach((val, key) => {
            calls.push({
                roomId: key,
                ...val
            });
        });
    }
    return { statusCode: statusCodes.OK, data: calls, message: "Active calls fetched successfully" };
};

const endActiveCall = async (req) => {
    const { roomId } = req.params;

    if (global.activeCalls && global.activeCalls.has(roomId)) {
        global.activeCalls.delete(roomId);
        if (global.io) {
            global.io.to(roomId).emit("callEnded", { roomId });
        }
        return { statusCode: statusCodes.OK, message: "Call terminated successfully" };
    }

    throw new ErrorHandler(statusCodes.NOT_FOUND, "No active call found in this room");
};

const getAnalytics = async () => {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isOnline: true });
    const totalTeams = await Rooms.countDocuments({ roomType: "group" });
    const totalChats = await Rooms.countDocuments();
    const totalMessages = await Messages.countDocuments();
    
    // Active Calls size
    const activeCallsCount = global.activeCalls ? global.activeCalls.size : 0;

    // Messages per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const messageStats = await Messages.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return {
        statusCode: statusCodes.OK,
        data: {
            stats: {
                totalUsers,
                activeUsers,
                totalTeams,
                totalChats,
                totalMessages,
                activeCallsCount
            },
            messageStats
        },
        message: "Analytics statistics retrieved successfully"
    };
};

const getSystemConfig = async () => {
    const config = await getOrCreateSystemConfig();
    return { statusCode: statusCodes.OK, data: config, message: "System configuration retrieved" };
};

const updateSystemConfig = async (req) => {
    const config = await getOrCreateSystemConfig();
    const { rateLimit, fileUploadLimit, enableCalling, enableRegistration, enableFileUpload } = req.body;

    if (rateLimit !== undefined) config.rateLimit = rateLimit;
    if (fileUploadLimit !== undefined) config.fileUploadLimit = fileUploadLimit;
    if (enableCalling !== undefined) config.enableCalling = enableCalling;
    if (enableRegistration !== undefined) config.enableRegistration = enableRegistration;
    if (enableFileUpload !== undefined) config.enableFileUpload = enableFileUpload;

    await config.save();
    return { statusCode: statusCodes.OK, data: config, message: "System configuration updated successfully" };
};

const getJobs = async () => {
    await seedJobsIfEmpty();
    const jobs = await AdminJobs.find().sort({ name: 1 });
    return { statusCode: statusCodes.OK, data: jobs, message: "Background jobs fetched" };
};

const runJob = async (req) => {
    const { id } = req.params;
    const job = await AdminJobs.findById(id);
    if (!job) {
        throw new ErrorHandler(statusCodes.NOT_FOUND, "Job not found");
    }

    job.status = "RUNNING";
    await job.save();

    // Trigger async simulate run
    setTimeout(async () => {
        try {
            job.status = "COMPLETED";
            job.lastRun = new Date();
            job.nextRun = new Date(Date.now() + 3600 * 1000 * 12);
            job.runCount += 1;
            job.failureReason = "";
            await job.save();
        } catch (err) {
            console.error("Failed to update job status:", err);
        }
    }, 1500);

    return { statusCode: statusCodes.OK, data: job, message: "Job initiated successfully" };
};

const broadcastNotification = async (req) => {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
        throw new ErrorHandler(statusCodes.BAD_REQUEST, "Notification content cannot be empty");
    }

    const allUsers = await User.find({ _id: { $ne: userId } });
    
    // Create a special dummy broadcast message or directly populate notifications
    // Create a system message in a special dummy room or just create direct notifications referencing no message
    // Since notifications schema requires messageId, let's create a silent system message or update schema.
    // Wait! Let's check: if we create a broadcast message in a global room, or if we create notifications referencing the sender and a system message?
    // Let's create a silent broadcast message under the Admin user in a special broadcast Room (or create one on-the-fly)
    let broadcastRoom = await Rooms.findOne({ roomName: "System Broadcasts", roomType: "group" });
    if (!broadcastRoom) {
        broadcastRoom = await Rooms.create({
            roomName: "System Broadcasts",
            roomType: "group",
            members: [userId]
        });
    }

    const broadcastMessage = await Messages.create({
        roomId: broadcastRoom._id,
        sender: userId,
        content: `[Broadcast] ${content.trim()}`
    });

    const notifData = allUsers.map(u => ({
        userId: u._id,
        messageId: broadcastMessage._id,
        roomId: broadcastRoom._id,
        status: "unread"
    }));

    await Notifications.insertMany(notifData);

    // Relay real-time newNotification socket event to all connected sockets
    if (global.io) {
        global.io.emit("newNotification");
    }

    return { statusCode: statusCodes.OK, message: "Broadcast notification sent to all active users" };
};

module.exports = {
    getUsers,
    toggleBlockUser,
    deleteUser,
    getUserActivity,
    getTeams,
    deleteTeam,
    updateTeamMembers,
    getChats,
    deleteMessage,
    flagMessage,
    getActiveCalls,
    endActiveCall,
    getAnalytics,
    getSystemConfig,
    updateSystemConfig,
    getJobs,
    runJob,
    broadcastNotification
};
