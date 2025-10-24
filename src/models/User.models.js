import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
    accessToken: { type: String },

    phoneNumber: { type: Number, required: true, unique: true },
    U_Id: { type: String, unique: true, index: true },  // Custom user ID
    description: { type: String, default: "" },

    secondaryChat: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date, default: Date.now }
    }],
    primaryChat: [{ type: Schema.Types.ObjectId, ref: 'User' }],


    online: { type: Boolean, default: false },
    lastSeen: { type: Date }
}, {
    timestamps: true
});

export const User = mongoose.model('User', UserSchema);
