import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
    accessToken: { type: String },

    phoneNumber: { type: Number, required: true, unique: true },
    U_Id: { type: String, unique: true, index: true },  // Custom user ID
    description: { type: String, default: "" },

    primaryChat: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
    secondaryChat: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
}, {
    timestamps: true
});

// Optional: Add index for faster phone lookups (useful for OTP login)
UserSchema.index({ phoneNumber: 1 });

export const User = mongoose.model('User', UserSchema);
