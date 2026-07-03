const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", required: true
    },
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rooms",
        required: true
    },
    status: {
        type: String,
        enum: ["unread", "read"],
        default: "unread"
    }
}, {timestamps:true});

module.exports = mongoose.model("Notifications", notificationSchema);