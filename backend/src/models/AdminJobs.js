const mongoose = require('mongoose');

const adminJobsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    lastRun: {
        type: Date
    },
    nextRun: {
        type: Date
    },
    runCount: {
        type: Number,
        default: 0
    },
    failureReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminJobs', adminJobsSchema);
