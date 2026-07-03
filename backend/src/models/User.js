const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true, 
    },
    lastName: {
        type: String,
        required: true, 
    },
    email: {
        type: String,
        required: true, 
        unique: true,   
    },
    password: {
        type: String,
        required: true, 
    },    
    profilePicture: {
        type: String,
        default: '', 
    },
    phoneNo:{
        type:String,
        required:true,
    },
    role: {
        type: String,
        enum: ['ADMIN', 'MEMBER', 'GUEST'], 
        default: 'MEMBER'
    },
    isOnline: {
        type:Boolean,
        default:false
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);    
