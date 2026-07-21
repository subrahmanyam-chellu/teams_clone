const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    rateLimit: {
        type: Number,
        default: 100
    },
    fileUploadLimit: {
        type: Number,
        default: 20 // in MB
    },
    enableCalling: {
        type: Boolean,
        default: true
    },
    enableRegistration: {
        type: Boolean,
        default: true
    },
    enableFileUpload: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
