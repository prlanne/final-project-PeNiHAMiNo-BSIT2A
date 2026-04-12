const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
        required: true,
        default: 'Seller',
        enum: ['Admin', 'Seller', 'Buyer'] 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    }
}, { 
    // This helper option removes the __v version key from your documents
    versionKey: false 
});

module.exports = mongoose.model('User', UserSchema);