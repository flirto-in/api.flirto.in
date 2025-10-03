import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const { Schema } = mongoose;

const PremiumSchema = new Schema({
    premium01: { type: Boolean, default: false },
    premium02: { type: Boolean, default: false },
    premium03: { type: Boolean, default: false },
    premium04: { type: Boolean, default: false },
    premium05: { type: Boolean, default: false },
}, { _id: false });

const UserSchema = new Schema({
    //email: { type: String, required: true, lowercase: true, unique: true},
    refreshToken: { type: String },

    phoneNumber: { type: Number}, 
    googleId: { type: String},
    name: { type: String },
    picture: { type: String },
    U_Id: { type: String, unique: true },        // custom id
    description: { type: String },
    tags: [{ type: String }],
    interests: [{ type: String }],

    // relations
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
    primaryChat: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    secondaryChat: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    searchHistory: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dailyAsk: { type: Schema.Types.ObjectId, ref: 'DailyAsk' },
    isVerified: { type: Boolean, default: false },

    premium: PremiumSchema,
}, {
    timestamps: true
});

// Pre-save hook for hashing password
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Method to check password
UserSchema.methods.isPasswordCorrect = async function (password) {
    return bcrypt.compare(password, this.password);
};

// Generate Access Token
UserSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, email: this.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
    );
};

export const User = mongoose.model('User', UserSchema);
