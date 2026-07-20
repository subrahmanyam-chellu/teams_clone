const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rooms",
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Meetings", meetingSchema);
