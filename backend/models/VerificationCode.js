const mongoose = require('mongoose');

const bentaboardDB = mongoose.connection.useDb('bentaboard');

const verificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    code: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
}, {
    collection: 'invalidemails'
});

module.exports = bentaboardDB.model('VerificationCode', verificationCodeSchema);