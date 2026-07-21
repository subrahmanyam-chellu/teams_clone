const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rooms",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reciever: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    content: {
        type: String,
        trim: true,
        required: false
    },
    mediaUrl: [{
        type: String
    }],
    reactions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String
    }],
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        def: null
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    deliveryReceipts: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isDelivered: { type: Boolean, default: false },
        deliveredAt: Date
    }],
    readReceipts: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        isRead: { type: Boolean, default: false },
        readAt: Date
    }],
    edited: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    isCallMessage: {
        type: Boolean,
        default: false
    },
    isFlagged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("Messages", messageSchema);