const mongoose = require('mongoose');

const roomsSchema = new mongoose.Schema({
    roomProfile:{
        type: String,
        def: ""
    },
    roomName: {
        type: String,
        trim: true,
        required: true
    },
    roomType: {
        type: String,
        enum: ["private", "group"],
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages"
    }
},{timestamps:true});

module.exports = mongoose.model("Rooms", roomsSchema);