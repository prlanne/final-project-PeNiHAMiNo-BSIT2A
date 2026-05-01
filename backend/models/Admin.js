const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    full_name: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        default: 'Admin',
        enum: ['Admin']
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    versionKey: false,
    collection: 'admins'
});

module.exports = mongoose.model('Admin', AdminSchema);