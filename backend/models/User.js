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
    versionKey: false,
    collection: 'users'
});

// ✅ Save to 'test' database
const db = mongoose.connection.useDb('test');
module.exports = db.model('User', UserSchema);